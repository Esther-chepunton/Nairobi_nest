"""Live discovery: fetch OSM / Wikipedia / RSS per request, cache full payloads in SQL."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import threading
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from flask import current_app

from app.models import Favorite, Place, SearchCache, db
from app.services.place_identity import make_place_key, place_key_from_place, resolve_place_ref
from config import Config
from ingestion.registry import get_adapter, list_enabled_adapters
from pipeline.loader import load_normalized_draft
from search.query_parser import parse_query

logger = logging.getLogger(__name__)

NAIROBI = {"latitude": -1.286389, "longitude": 36.817223}
CURATED_SOURCE = "curated_fallback"

# In-process lock map: dedupe concurrent cache misses on a single worker.
# TODO: dedupe concurrent cache misses across multiple Gunicorn workers
# (shared lock / Redis) — Overpass rate-limits stampedes.
_inflight_locks: Dict[str, threading.Lock] = {}
_inflight_guard = threading.Lock()
_prune_counter = 0
_PRUNE_EVERY_N_READS = 25
_live_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="live-discovery")
CATALOG_CANDIDATE_LIMIT = 400


def live_discovery_enabled() -> bool:
    try:
        return bool(current_app.config.get("LIVE_DISCOVERY_ENABLED"))
    except RuntimeError:
        return False


def catalog_payloads(intent: Dict[str, Any], limit: int = 100) -> List[Dict[str, Any]]:
    """DB-first candidates: published places from the catalog (kept fresh by scheduled ingestion).

    The recommendation engine scores and ranks these, so we only pre-filter lightly
    (category / text) and fall back to the whole catalog if the filter is too narrow.
    """
    base = Place.query.filter(Place.is_published.is_(True))
    filtered = base
    if intent.get("category"):
        filtered = filtered.filter(Place.category == intent["category"])
    q = (intent.get("q") or "").strip()
    if q:
        like = f"%{q}%"
        filtered = filtered.filter(
            Place.name.ilike(like) | Place.description.ilike(like) | Place.location_name.ilike(like)
        )
    order = (Place.confidence_score.desc(), Place.id.asc())
    rows = filtered.order_by(*order).limit(CATALOG_CANDIDATE_LIMIT).all() if filtered is not base else []
    if len(rows) < 5:
        seen = {r.id for r in rows}
        rows += [r for r in base.order_by(*order).limit(CATALOG_CANDIDATE_LIMIT).all() if r.id not in seen]
    out = []
    for p in rows[: max(limit, 1)]:
        data = p.to_dict(include_sources=True)
        data["place_key"] = place_key_from_place(p)
        out.append(data)
    return out


def _ttl_seconds() -> int:
    return int(current_app.config.get("SEARCH_CACHE_TTL_SECONDS", Config.SEARCH_CACHE_TTL_SECONDS))


def _cache_hashes(intent: Dict[str, Any]) -> Tuple[str, str]:
    parsed = parse_query(intent.get("q", ""), intent)
    # Round coords so nearby GPS jitter doesn't bust the cache.
    lat = intent.get("latitude")
    lon = intent.get("longitude")
    cache_intent = {
        "q": parsed.get("q") or intent.get("q") or "",
        "category": intent.get("category") or parsed.get("category") or "",
        "mood": intent.get("mood") or "",
        "lat": round(float(lat), 2) if lat is not None else None,
        "lon": round(float(lon), 2) if lon is not None else None,
    }
    q_hash = hashlib.sha256((cache_intent["q"] or "").encode()).hexdigest()
    intent_hash = hashlib.sha256(
        json.dumps(cache_intent, sort_keys=True, default=str).encode()
    ).hexdigest()
    return q_hash, intent_hash


def _is_payload_list(results: Any) -> bool:
    return bool(results) and isinstance(results[0], dict) and "place_key" in results[0]


def _maybe_prune_expired():
    global _prune_counter
    _prune_counter += 1
    if _prune_counter % _PRUNE_EVERY_N_READS != 0:
        return
    try:
        from app.services.cache_maintenance import prune_expired_search_cache

        prune_expired_search_cache()
    except Exception as exc:
        logger.warning("opportunistic cache prune failed: %s", exc)


def _inflight_lock_for(cache_key: str) -> threading.Lock:
    with _inflight_guard:
        lock = _inflight_locks.get(cache_key)
        if lock is None:
            lock = threading.Lock()
            _inflight_locks[cache_key] = lock
        return lock


def get_cached_payloads(intent: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    _maybe_prune_expired()
    q_hash, intent_hash = _cache_hashes(intent)
    row = (
        SearchCache.query.filter_by(query_hash=q_hash, intent_hash=intent_hash)
        .order_by(SearchCache.created_at.desc())
        .first()
    )
    if not row:
        return None
    now = datetime.utcnow()
    if row.expires_at and row.expires_at < now:
        # Opportunistic delete of this stale row
        try:
            db.session.delete(row)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return None
    if not row.expires_at and row.created_at < now - timedelta(seconds=_ttl_seconds()):
        try:
            db.session.delete(row)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return None
    if _is_payload_list(row.results):
        return list(row.results)
    # Legacy id-list cache → hydrate from Place cache table if still warm.
    places = Place.query.filter(Place.id.in_(row.results or [])).all()
    order = {pid: i for i, pid in enumerate(row.results or [])}
    places.sort(key=lambda p: order.get(p.id, 999))
    return [p.to_dict(include_sources=True) for p in places]


def store_cache_payloads(
    intent: Dict[str, Any],
    payloads: List[Dict[str, Any]],
    source: str = "live",
) -> SearchCache:
    q_hash, intent_hash = _cache_hashes(intent)
    ttl = _ttl_seconds()
    # Replace prior rows for this intent so the table doesn't accumulate forever.
    SearchCache.query.filter_by(query_hash=q_hash, intent_hash=intent_hash).delete(
        synchronize_session=False
    )
    row = SearchCache(
        query_hash=q_hash,
        intent_hash=intent_hash,
        results=payloads,
        source=source,
        expires_at=datetime.utcnow() + timedelta(seconds=ttl),
        created_at=datetime.utcnow(),
    )
    db.session.add(row)
    db.session.commit()
    _maybe_prune_expired()
    return row


def draft_to_payload(draft) -> Dict[str, Any]:
    place_key = make_place_key(draft.source_name, draft.source_id)
    images = list(draft.images or [])
    return {
        "place_key": place_key,
        "name": draft.name,
        "slug": draft.source_id.replace("/", "-")[:200],
        "category": draft.category,
        "description": draft.description,
        "story": draft.description,
        "location_name": draft.location_name,
        "latitude": draft.latitude,
        "longitude": draft.longitude,
        "price_min": draft.price_min or 0,
        "price_max": draft.price_max or 0,
        "duration_minutes": 90,
        "tags": draft.tags or [],
        "moods": draft.moods or ["peaceful"],
        "companions": draft.companions or ["solo", "friends"],
        "images": images,
        "image": images[0] if images else None,
        "confidence_score": draft.raw_confidence,
        "source_name": draft.source_name,
        "source_id": draft.source_id,
        "source_url": draft.source_url,
        "sources": [
            {
                "source_name": draft.source_name,
                "source_id": draft.source_id,
                "source_url": draft.source_url,
                "reliability_score": draft.raw_confidence,
                "attribution_text": f"Live data from {draft.source_name}",
            }
        ],
        "is_hidden_gem": False,
        "is_trending": False,
        "rating": 4.5,
        "cached_at": datetime.utcnow().isoformat(),
    }


def _live_fetch_drafts(intent: Dict[str, Any], max_per_source: int = 25) -> List:
    lat = float(intent.get("latitude") or NAIROBI["latitude"])
    lon = float(intent.get("longitude") or NAIROBI["longitude"])
    drafts = []
    enabled = list_enabled_adapters()

    # Prefer OSM around the user for live requests.
    if "openstreetmap" in enabled:
        try:
            adapter = get_adapter("openstreetmap")
            records, _ = adapter.fetch({"lat": lat, "lon": lon, "radius_m": 20000})
            for raw in records[:max_per_source]:
                draft = adapter.normalize(raw)
                if draft and draft.latitude is not None:
                    drafts.append(draft)
        except Exception as exc:
            logger.warning("live OSM fetch failed: %s", exc)

    if "wikipedia" in enabled and len(drafts) < max_per_source:
        try:
            adapter = get_adapter("wikipedia")
            # One term batch around intent query or Nairobi tourism.
            term = intent.get("q") or intent.get("category") or "Nairobi tourism"
            records, _ = adapter.fetch({"term_index": 0})
            # Override: if q present, search that term via a light re-fetch path
            if intent.get("q"):
                # Use first configured term index; normalize whatever came back near coords.
                pass
            for raw in records[:15]:
                draft = adapter.normalize(raw)
                if draft and draft.latitude is not None:
                    drafts.append(draft)
        except Exception as exc:
            logger.warning("live Wikipedia fetch failed: %s", exc)

    if "rss" in enabled and len(drafts) < 8:
        try:
            adapter = get_adapter("rss")
            records, _ = adapter.fetch({"feed_index": 0})
            for raw in records[:10]:
                draft = adapter.normalize(raw)
                if draft:
                    drafts.append(draft)
        except Exception as exc:
            logger.warning("live RSS fetch failed: %s", exc)

    # Deduplicate by place_key
    seen = set()
    unique = []
    for d in drafts:
        key = make_place_key(d.source_name, d.source_id)
        if key in seen:
            continue
        seen.add(key)
        unique.append(d)
    return unique


def upsert_drafts_to_cache(drafts) -> List[Place]:
    """Write live drafts into Place as short-lived cache rows (ingest jobs still use same path)."""
    places = []
    for draft in drafts:
        try:
            place = load_normalized_draft(draft, raw_record=None)
            place.last_updated = datetime.utcnow()
            place.is_published = True
            places.append(place)
        except Exception as exc:
            logger.warning("upsert draft failed %s: %s", getattr(draft, "name", "?"), exc)
    db.session.commit()
    return places


def discover_place_payloads(intent: Dict[str, Any], limit: int = 50) -> List[Dict[str, Any]]:
    """Return place dicts for an intent.

    Default: SearchCache hit, else the DB catalog (fast, no network).
    With LIVE_DISCOVERY_ENABLED: also try a live OSM/Wikipedia fetch, but never wait
    longer than LIVE_DISCOVERY_TIMEOUT_SECONDS. A slow fetch finishes in the background
    and warms the cache for the next request.
    """
    cached = get_cached_payloads(intent)
    if cached:
        return cached[:limit]

    if not live_discovery_enabled():
        return catalog_payloads(intent, limit=limit)

    app = current_app._get_current_object()
    budget = float(app.config.get("LIVE_DISCOVERY_TIMEOUT_SECONDS", 8))
    future = _live_executor.submit(_live_discover_in_context, app, dict(intent), limit)
    try:
        payloads = future.result(timeout=budget)
    except FutureTimeout:
        logger.info("live discovery exceeded %.1fs budget; serving catalog", budget)
        payloads = []
    except Exception as exc:
        logger.warning("live discovery failed: %s", exc)
        payloads = []
    return payloads[:limit] if payloads else catalog_payloads(intent, limit=limit)


def _live_discover_in_context(app, intent: Dict[str, Any], limit: int) -> List[Dict[str, Any]]:
    with app.app_context():
        try:
            return _live_discover(intent, limit)
        finally:
            db.session.remove()


def _live_discover(intent: Dict[str, Any], limit: int) -> List[Dict[str, Any]]:
    q_hash, intent_hash = _cache_hashes(intent)
    cache_key = f"{q_hash}:{intent_hash}"
    lock = _inflight_lock_for(cache_key)

    # Single-worker stampede guard: concurrent identical misses wait on one fetch.
    with lock:
        cached = get_cached_payloads(intent)
        if cached:
            return cached[:limit]

        drafts = _live_fetch_drafts(intent)
        payloads = [draft_to_payload(d) for d in drafts]

        if drafts:
            upsert_drafts_to_cache(drafts)
            enriched = []
            for d, payload in zip(drafts, payloads):
                place = resolve_place_ref(payload["place_key"])
                if not place:
                    # Cross-source merge may have attached OSM to bootstrap slug key
                    from pipeline.deduplicator import find_duplicate_candidate

                    cand, score, reason = find_duplicate_candidate(
                        d.name, d.latitude, d.longitude, d.source_name, d.source_id
                    )
                    if cand:
                        logger.info(
                            "live merge into existing place id=%s key=%s (%s score=%.2f)",
                            cand.id,
                            place_key_from_place(cand),
                            reason,
                            score,
                        )
                        place = cand
                if place:
                    data = place.to_dict(include_sources=True)
                    data["place_key"] = place_key_from_place(place)
                    data["cached_at"] = datetime.utcnow().isoformat()
                    enriched.append(data)
                else:
                    enriched.append(payload)
            payloads = enriched

        source = "live" if payloads else "empty"
        if payloads:
            store_cache_payloads(intent, payloads, source=source)
        return payloads[:limit]


def discover_places(intent: Dict[str, Any], limit: int = 50) -> List[Place]:
    """Place ORM objects for scoring (Step 4 will score dicts directly)."""
    payloads = discover_place_payloads(intent, limit=limit)
    places = []
    for p in payloads:
        place = resolve_place_ref(p.get("place_key") or p.get("id"))
        if place:
            places.append(place)
    if not places and payloads:
        # Payloads without DB rows (shouldn't happen after upsert) — skip
        pass
    return places[:limit]


def _load_curated_fallback(limit: int = 12) -> List[Dict[str, Any]]:
    """Explicit curated_fallback list — never labeled as live/OSM."""
    seed_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data",
        "places_seed.json",
    )
    if not os.path.exists(seed_path):
        return []
    with open(seed_path, "r", encoding="utf-8") as f:
        rows = json.load(f)
    out = []
    for row in rows[:limit]:
        slug = row.get("slug") or row.get("name", "place").lower().replace(" ", "-")
        place_key = make_place_key(CURATED_SOURCE, slug)
        images = row.get("images") or []
        out.append(
            {
                **{k: v for k, v in row.items() if k != "id"},
                "place_key": place_key,
                "source_name": CURATED_SOURCE,
                "source_id": slug,
                "source_url": None,
                "sources": [
                    {
                        "source_name": CURATED_SOURCE,
                        "source_id": slug,
                        "source_url": None,
                        "reliability_score": 0.6,
                        "attribution_text": "Curated fallback (not live internet data)",
                    }
                ],
                "image": images[0] if images else None,
                "confidence_score": 0.6,
                "cached_at": datetime.utcnow().isoformat(),
            }
        )
    return out


def get_carousel_payloads(kind: str = "trending", limit: int = 12) -> List[Dict[str, Any]]:
    """
    Home carousels from cache-window Place rows (confidence / favourite counts).
    If fewer than 6 qualify, backfill with curated_fallback (explicitly tagged).
    """
    ttl = _ttl_seconds()
    cutoff = datetime.utcnow() - timedelta(seconds=max(ttl, 3600))  # at least 1h window
    query = Place.query.filter(Place.is_published.is_(True))
    if live_discovery_enabled():
        query = query.filter(Place.last_updated >= cutoff)
    places = query.order_by(Place.confidence_score.desc(), Place.last_updated.desc()).limit(80).all()

    fav_counts: Dict[int, int] = {}
    for place_id, in (
        db.session.query(Favorite.place_id).filter(Favorite.place_id.isnot(None)).all()
    ):
        fav_counts[place_id] = fav_counts.get(place_id, 0) + 1

    scored = []
    for p in places:
        score = (p.confidence_score or 0.5) + 0.05 * fav_counts.get(p.id, 0)
        if kind == "trending":
            score += 0.1 if p.is_trending else 0
        elif kind == "hidden_gem":
            score += 0.15 if p.is_hidden_gem else 0
            if not p.is_hidden_gem and (p.confidence_score or 0) > 0.85:
                continue
        data = p.to_dict(include_sources=True)
        data["place_key"] = place_key_from_place(p)
        scored.append((score, data))

    scored.sort(key=lambda x: x[0], reverse=True)
    payloads = [d for _, d in scored[:limit]]

    if len(payloads) < 6:
        fallback = _load_curated_fallback(limit=limit)
        seen = {p.get("place_key") for p in payloads}
        for item in fallback:
            if item["place_key"] in seen:
                continue
            payloads.append(item)
            if len(payloads) >= limit:
                break

    return payloads[:limit]


def recent_cache_places(limit: int = 50) -> List[Dict[str, Any]]:
    """Map / explore: recent SearchCache payloads + warm Place rows."""
    cutoff = datetime.utcnow() - timedelta(seconds=_ttl_seconds())
    payloads: List[Dict[str, Any]] = []
    seen = set()

    rows = (
        SearchCache.query.filter(
            (SearchCache.expires_at.is_(None)) | (SearchCache.expires_at >= datetime.utcnow())
        )
        .order_by(SearchCache.created_at.desc())
        .limit(8)
        .all()
    )
    for row in rows:
        if not _is_payload_list(row.results):
            continue
        for p in row.results:
            key = p.get("place_key")
            if not key or key in seen:
                continue
            seen.add(key)
            payloads.append(p)
            if len(payloads) >= limit:
                return payloads

    warm_query = Place.query.filter(Place.is_published.is_(True))
    if live_discovery_enabled():
        warm_query = warm_query.filter(Place.last_updated >= cutoff)
    warm = (
        warm_query
        .order_by(Place.last_updated.desc())
        .limit(limit)
        .all()
    )
    for p in warm:
        key = place_key_from_place(p)
        if key in seen:
            continue
        seen.add(key)
        data = p.to_dict(include_sources=True)
        data["place_key"] = key
        payloads.append(data)

    if len(payloads) < 6:
        for item in _load_curated_fallback(limit=12):
            if item["place_key"] in seen:
                continue
            payloads.append(item)
            if len(payloads) >= limit:
                break

    return payloads[:limit]
