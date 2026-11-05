"""Stable place identity: source_name:source_id (not auto-increment DB ids)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional, Tuple
from urllib.parse import unquote

from app.models import Place, PlaceSource


def make_place_key(source_name: str, source_id: str) -> str:
    source_name = (source_name or "unknown").strip().lower()
    source_id = str(source_id or "").strip()
    if not source_id:
        raise ValueError("source_id is required for place_key")
    return f"{source_name}:{source_id}"


def parse_place_key(place_key: str) -> Tuple[str, str]:
    raw = unquote(place_key or "").strip()
    if ":" not in raw:
        raise ValueError(f"Invalid place_key: {place_key}")
    source_name, source_id = raw.split(":", 1)
    if not source_name or not source_id:
        raise ValueError(f"Invalid place_key: {place_key}")
    return source_name.lower(), source_id


def primary_source(place: Place) -> Optional[PlaceSource]:
    sources = list(place.sources or [])
    if not sources:
        return None
    return sorted(sources, key=lambda s: -(s.reliability_score or 0))[0]


def place_key_from_place(place: Place) -> str:
    src = primary_source(place)
    if src and src.source_id:
        return make_place_key(src.source_name, src.source_id)
    # Bootstrap / legacy places without a source_id use slug.
    return make_place_key("manual_bootstrap", place.slug or str(place.id))


def resolve_place_ref(place_ref: Any) -> Optional[Place]:
    """Resolve numeric id, place_key, or slug to a Place row (cache/catalog)."""
    if place_ref is None:
        return None
    ref = unquote(str(place_ref)).strip()
    if not ref:
        return None

    if ref.isdigit():
        return Place.query.get(int(ref))

    if ":" in ref:
        try:
            source_name, source_id = parse_place_key(ref)
        except ValueError:
            return None
        link = PlaceSource.query.filter_by(
            source_name=source_name, source_id=source_id
        ).first()
        if link:
            return Place.query.get(link.place_id)
        # Fallback: manual_bootstrap used slug as source_id
        if source_name == "manual_bootstrap":
            return Place.query.filter_by(slug=source_id).first()
        return None

    return Place.query.filter_by(slug=ref).first()


def snapshot_from_place(place: Place) -> Dict[str, Any]:
    """Denormalized place payload frozen at save time."""
    src = primary_source(place)
    data = place.to_dict(include_sources=True)
    key = place_key_from_place(place)
    data["place_key"] = key
    data["source_name"] = src.source_name if src else "manual_bootstrap"
    data["source_id"] = (src.source_id if src else None) or place.slug or str(place.id)
    data["source_url"] = src.source_url if src else None
    data["attribution_text"] = src.attribution_text if src else None
    data["saved_at"] = datetime.utcnow().isoformat()
    # Keep legacy numeric id while Place cache rows still exist (Step 3 may drop this).
    data["legacy_place_id"] = place.id
    return data


def snapshot_from_client_payload(data: Dict[str, Any], place: Optional[Place] = None) -> Dict[str, Any]:
    """Build snapshot from optional client place payload + optional resolved Place."""
    if place is not None:
        base = snapshot_from_place(place)
    else:
        base = {}

    client_place = data.get("place") if isinstance(data.get("place"), dict) else data
    if not isinstance(client_place, dict):
        client_place = {}

    place_key = data.get("place_key") or client_place.get("place_key")
    if not place_key and place is not None:
        place_key = place_key_from_place(place)
    if not place_key:
        source_name = (
            data.get("source_name")
            or client_place.get("source_name")
            or (client_place.get("sources") or [{}])[0].get("source_name")
        )
        source_id = (
            data.get("source_id")
            or client_place.get("source_id")
            or (client_place.get("sources") or [{}])[0].get("source_id")
            or client_place.get("slug")
        )
        if source_name and source_id:
            place_key = make_place_key(source_name, source_id)

    if not place_key:
        raise ValueError("place_key or resolvable place_id/source is required")

    merged = {**base, **{k: v for k, v in client_place.items() if v is not None}}
    merged["place_key"] = place_key
    try:
        source_name, source_id = parse_place_key(place_key)
    except ValueError:
        source_name, source_id = "unknown", place_key
    merged.setdefault("source_name", source_name)
    merged.setdefault("source_id", source_id)
    merged.setdefault("saved_at", datetime.utcnow().isoformat())
    if place is not None:
        merged.setdefault("legacy_place_id", place.id)
        merged.setdefault("id", place.id)
    return merged


def favorite_place_view(favorite) -> Dict[str, Any]:
    if favorite.snapshot:
        place = dict(favorite.snapshot)
    else:
        place = {
            "place_key": favorite.place_key,
            "name": favorite.name,
            "description": favorite.description,
            "story": favorite.story,
            "image": favorite.image_url,
            "images": [favorite.image_url] if favorite.image_url else [],
            "location_name": favorite.location_name,
            "source_name": favorite.source_name,
            "source_id": favorite.source_id,
            "source_url": favorite.source_url,
            "latitude": favorite.latitude,
            "longitude": favorite.longitude,
            "category": favorite.category,
            "price_min": favorite.price_min,
            "price_max": favorite.price_max,
            "id": favorite.place_id,
            "legacy_place_id": favorite.place_id,
        }
    place["place_key"] = favorite.place_key or place.get("place_key")
    # Prefer stable key for client routing; keep numeric id when present.
    if place.get("legacy_place_id") and not place.get("id"):
        place["id"] = place["legacy_place_id"]
    return place


def itinerary_item_place_view(item) -> Dict[str, Any]:
    if item.snapshot:
        place = dict(item.snapshot)
    elif item.place:
        place = snapshot_from_place(item.place)
    else:
        place = {
            "place_key": item.place_key,
            "name": item.name,
            "description": item.description,
            "story": item.story,
            "image": item.image_url,
            "images": [item.image_url] if item.image_url else [],
            "location_name": item.location_name,
            "source_name": item.source_name,
            "source_url": item.source_url,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "category": item.category,
            "price_min": item.price_min,
            "price_max": item.price_max,
            "id": item.place_id,
            "legacy_place_id": item.place_id,
        }
    place["place_key"] = item.place_key or place.get("place_key")
    if place.get("legacy_place_id") and not place.get("id"):
        place["id"] = place["legacy_place_id"]
    return place
