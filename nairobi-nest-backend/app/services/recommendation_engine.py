"""Intent scoring over place dicts (live/cache payloads) — not Place ORM querysets."""

import re

from geopy.distance import geodesic

from app.services.live_discovery import (
    _load_curated_fallback,
    discover_place_payloads,
    live_discovery_enabled,
)

NAIROBI_CENTER = (-1.286389, 36.817223)


def _distance_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 50.0
    return geodesic((lat1, lon1), (lat2, lon2)).km


def _get(place, key, default=None):
    if isinstance(place, dict):
        return place.get(key, default)
    return getattr(place, key, default)


def _as_str_list(value, split_words=False):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item not in (None, "")]
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if "," in text:
            return [part.strip() for part in text.split(",") if part.strip()]
        if split_words and " " in text:
            return [part.strip() for part in text.split() if part.strip()]
        return [text]
    return []


_STOPWORDS = {
    "the", "and", "with", "for", "near", "nairobi", "kenya", "place", "places", "spot",
    "spots", "some", "somewhere", "good", "best", "nice", "want", "find", "around", "from",
    "this", "that", "today", "weekend", "visit", "things", "what", "where",
}


def _search_terms(intent) -> set:
    text = " ".join(
        [str(intent.get("q") or "")] + [str(k) for k in (intent.get("keywords") or [])]
    ).lower()
    return {t for t in re.findall(r"[a-z]{3,}", text) if t not in _STOPWORDS}


def _place_haystack(place) -> str:
    parts = [
        _get(place, "name") or "",
        _get(place, "description") or "",
        _get(place, "category") or "",
        _get(place, "location_name") or "",
        " ".join(_as_str_list(_get(place, "tags"))),
        " ".join(_as_str_list(_get(place, "moods"))),
    ]
    return " ".join(str(p) for p in parts).lower()


def score_place(place, intent, user_preferences=None):
    """Score a place dict (or ORM-like object) 0–1 against user intent."""
    scores = []
    reasons = []

    user_lat = intent.get("latitude") or NAIROBI_CENTER[0]
    user_lon = intent.get("longitude") or NAIROBI_CENTER[1]
    lat = _get(place, "latitude")
    lon = _get(place, "longitude")

    dist = _distance_km(user_lat, user_lon, lat, lon)
    dist_score = max(0, 1 - dist / 80)
    scores.append(dist_score * 0.22)
    travel = _get(place, "travel_time_from_nairobi")
    if dist < 15:
        reasons.append(f"{int(dist * 3)} min away")
    elif travel:
        reasons.append(travel)

    price_min = _get(place, "price_min") or 0
    price_max = _get(place, "price_max") or 0
    budget_max = intent.get("budget_max")
    if budget_max:
        if price_max <= budget_max:
            scores.append(0.22)
            reasons.append("Within budget")
        elif price_min <= budget_max:
            scores.append(0.12)
            reasons.append("Mostly within budget")
        else:
            scores.append(0.05)
    else:
        scores.append(0.12)

    time_available = intent.get("time_available_minutes")
    duration = _get(place, "duration_minutes") or 90
    if time_available and duration:
        if duration <= time_available:
            scores.append(0.18)
            reasons.append("Fits your schedule")
        elif duration <= time_available * 1.3:
            scores.append(0.08)
        else:
            scores.append(0.02)
    else:
        scores.append(0.08)

    mood = (intent.get("mood") or "").lower()
    moods = _as_str_list(_get(place, "moods"))
    if mood and moods:
        mood_match = any(mood in str(m).lower() for m in moods)
        if mood_match:
            scores.append(0.14)
            reasons.append(f"{mood.capitalize()} mood match")
        else:
            scores.append(0.04)
    else:
        scores.append(0.06)

    companions = (intent.get("companions") or "").lower()
    comps = _as_str_list(_get(place, "companions"), split_words=True)
    if companions and comps:
        if companions in [str(c).lower() for c in comps]:
            scores.append(0.08)
            reasons.append(f"Great for {companions}")
        else:
            scores.append(0.02)
    else:
        scores.append(0.04)

    category = (intent.get("category") or "").lower()
    place_cat = (_get(place, "category") or "").lower()
    if category and place_cat and category == place_cat:
        scores.append(0.08)
        reasons.append(f"{category.capitalize()} spot")

    terms = _search_terms(intent)
    if terms:
        haystack = _place_haystack(place)
        hits = sum(1 for t in terms if t in haystack or (t.endswith("s") and t[:-1] in haystack))
        if hits:
            scores.append(min(0.3, 0.15 * hits))
            reasons.insert(0, "Matches your search")

    if intent.get("mood") == "adventurous" and _get(place, "is_hidden_gem"):
        scores.append(0.04)
        reasons.append("Hidden gem")

    exclude_ids = intent.get("exclude_place_ids") or []
    exclude_keys = list(intent.get("exclude_place_keys") or [])
    for item in exclude_ids:
        if isinstance(item, str) and ":" in item:
            exclude_keys.append(item)

    place_key = _get(place, "place_key")
    place_id = _get(place, "id") or _get(place, "legacy_place_id")

    if place_key and place_key in exclude_keys:
        return 0, ["Already visited"]
    if place_id is not None and place_id in exclude_ids:
        return 0, ["Already visited"]
    if place_id is not None and str(place_id) in [
        str(x) for x in exclude_ids if not (isinstance(x, str) and ":" in x)
    ]:
        return 0, ["Already visited"]

    if user_preferences:
        interests = user_preferences.get("interests") or []
        for tag in _as_str_list(_get(place, "tags")):
            if str(tag).lower() in [i.lower() for i in interests]:
                scores.append(0.04)
                reasons.append(f"Matches your interest in {tag}")
                break

    confidence = _get(place, "confidence_score") or 0.5
    scores.append(confidence * 0.08)
    if confidence >= 0.8 and _get(place, "source_name") != "curated_fallback":
        reasons.append("High-confidence listing")

    if _get(place, "source_name") == "curated_fallback":
        reasons = [r for r in reasons if "High-confidence" not in r][:2]
        reasons.append("Curated fallback")

    total = min(1.0, sum(scores))
    if not reasons:
        reasons.append("Recommended for you")
    return round(total, 2), reasons[:3]


def _normalize_payload(place) -> dict:
    if isinstance(place, dict):
        payload = dict(place)
    else:
        payload = place.to_dict(include_sources=True) if hasattr(place, "to_dict") else {}
        try:
            from app.services.place_identity import place_key_from_place

            payload["place_key"] = place_key_from_place(place)
        except Exception:
            pass
    if not payload.get("place_key") and payload.get("source_name") and payload.get("source_id"):
        from app.services.place_identity import make_place_key

        payload["place_key"] = make_place_key(payload["source_name"], payload["source_id"])
    payload["tags"] = _as_str_list(payload.get("tags"))
    payload["moods"] = _as_str_list(payload.get("moods"))
    payload["companions"] = _as_str_list(payload.get("companions"), split_words=True)
    raw_images = payload.get("images")
    if isinstance(raw_images, list):
        payload["images"] = [str(u).strip() for u in raw_images if str(u).strip().startswith("http")]
    elif isinstance(raw_images, str) and raw_images.strip().startswith("http"):
        payload["images"] = [raw_images.strip()]
    else:
        payload["images"] = []
    if not payload.get("image") and payload["images"]:
        payload["image"] = payload["images"][0]
    return payload


def recommend_places_from_dicts(payloads, intent, user_preferences=None, limit=12):
    scored = []
    for raw in payloads:
        payload = _normalize_payload(raw)
        score, reasons = score_place(payload, intent, user_preferences)
        if score > 0:
            scored.append(
                {"place": payload, "score": score, "match_reasons": reasons[:3]}
            )
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def recommend_from_intent(intent, user_preferences=None, limit=12):
    """End-to-end: live/cache payloads → score dicts (no ORM scoring path)."""
    payloads = discover_place_payloads(intent, limit=100)

    if len(payloads) < 5 and live_discovery_enabled():
        try:
            from jobs.queue import enqueue_job

            enqueue_job("on_demand_fetch", {"intent": intent}, priority=5)
        except Exception:
            pass

    if not payloads:
        payloads = _load_curated_fallback(limit=max(limit, 12))

    # Merge visited keys into exclude list for dict scoring
    visited = (user_preferences or {}).get("visited_place_ids") or intent.get(
        "exclude_place_ids"
    ) or []
    intent = {
        **intent,
        "exclude_place_ids": list(intent.get("exclude_place_ids") or []) + list(visited),
    }

    return recommend_places_from_dicts(payloads, intent, user_preferences, limit)
