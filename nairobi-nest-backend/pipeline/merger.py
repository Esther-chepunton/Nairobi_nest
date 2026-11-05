from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.models import Place


def _freshness_factor(fetched_at: Optional[datetime]) -> float:
    if not fetched_at:
        return 0.5
    age_days = (datetime.utcnow() - fetched_at).days
    if age_days <= 7:
        return 1.0
    if age_days <= 30:
        return 0.85
    if age_days <= 90:
        return 0.7
    return 0.5


def merge_field(
    current_value: Any,
    new_value: Any,
    current_score: float,
    new_score: float,
) -> tuple[Any, float, str]:
    if new_value is None or new_value == "" or new_value == []:
        return current_value, current_score, "existing"
    if current_value is None or current_value == "" or current_value == []:
        return new_value, new_score, "new"
    if new_score > current_score:
        return new_value, new_score, "new"
    return current_value, current_score, "existing"


def _coerce_list(value, split_words=False):
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


def merge_place_data(
    place: Place,
    incoming: Dict[str, Any],
    reliability: float,
    source_name: str,
) -> Place:
    fetched_at = incoming.get("fetched_at")
    freshness = _freshness_factor(fetched_at)
    score = reliability * freshness
    provenance = dict(place.field_provenance or {})

    scalar_fields = [
        "description", "location_name", "best_time", "difficulty",
        "travel_time_from_nairobi", "action_url",
    ]
    for field in scalar_fields:
        if field not in incoming:
            continue
        current_score = (provenance.get(field) or {}).get("score", 0.0)
        merged, new_score, winner = merge_field(
            getattr(place, field), incoming.get(field), current_score, score
        )
        setattr(place, field, merged)
        provenance[field] = {"source": source_name, "score": new_score, "winner": winner}

    if incoming.get("latitude") and incoming.get("longitude"):
        if not place.latitude or score > (provenance.get("coords") or {}).get("score", 0):
            place.latitude = incoming["latitude"]
            place.longitude = incoming["longitude"]
            provenance["coords"] = {"source": source_name, "score": score}

    for list_field in ("tags", "moods", "companions", "highlights", "tips"):
        split_words = list_field == "companions"
        existing = set(_coerce_list(getattr(place, list_field), split_words=split_words))
        incoming_vals = _coerce_list(incoming.get(list_field), split_words=split_words)
        if list_field in incoming or incoming.get("tags"):
            merged_list = list(existing | set(incoming_vals))
            if merged_list:
                setattr(place, list_field, merged_list[:20])

    if incoming.get("images"):
        existing_images = place.images or []
        merged_images = list(dict.fromkeys(existing_images + incoming["images"]))[:10]
        place.images = merged_images

    if incoming.get("opening_hours"):
        hours = dict(place.opening_hours or {})
        hours.update(incoming["opening_hours"])
        place.opening_hours = hours

    if incoming.get("price_min"):
        place.price_min = incoming["price_min"]
    if incoming.get("price_max"):
        place.price_max = incoming["price_max"]

    place.field_provenance = provenance
    place.confidence_score = min(1.0, max(place.confidence_score or 0, score))
    place.last_updated = datetime.utcnow()
    if incoming.get("google_maps_url"):
        place.google_maps_url = incoming["google_maps_url"]
    return place


def compute_confidence(place: Place, source_count: int) -> float:
    completeness = 0.0
    fields = [
        place.name, place.description, place.latitude, place.location_name,
        place.category, place.images,
    ]
    completeness = sum(1 for f in fields if f) / len(fields)
    source_bonus = min(0.2, source_count * 0.05)
    return round(min(1.0, completeness * 0.8 + source_bonus + (place.confidence_score or 0) * 0.2), 2)


def default_refresh_after(category: str) -> datetime:
    days = {"event": 7, "restaurant": 30, "cafe": 30}.get(category, 90)
    return datetime.utcnow() + timedelta(days=days)
