from typing import List, Optional, Tuple

from geopy.distance import geodesic
from rapidfuzz import fuzz

from app.models import Place, PlaceSource, db


def _name_score(a: str, b: str) -> float:
    return fuzz.token_sort_ratio(a.lower(), b.lower()) / 100.0


def find_duplicate_candidate(
    name: str,
    lat: Optional[float],
    lon: Optional[float],
    source_name: str,
    source_id: str,
) -> Tuple[Optional[Place], float, str]:
    existing_source = PlaceSource.query.filter_by(
        source_name=source_name, source_id=source_id
    ).first()
    if existing_source:
        return existing_source.place, 1.0, "exact_source_id"

    candidates = Place.query.filter(Place.is_published.is_(True)).all()
    best_place = None
    best_score = 0.0
    best_reason = ""

    for place in candidates:
        name_sim = _name_score(name, place.name)
        geo_score = 0.0
        dist_km = None
        if lat is not None and lon is not None and place.latitude and place.longitude:
            dist_km = geodesic((lat, lon), (place.latitude, place.longitude)).km
            threshold = 0.5 if dist_km < 0.15 else (0.35 if dist_km < 0.5 else (0.2 if dist_km < 1.0 else 0.0))
            geo_score = threshold

        combined = name_sim * 0.6 + geo_score * 0.4
        # Near-exact name within 1km → treat as same place across sources
        # (e.g. seed Karura Forest + OSM node for Karura Forest).
        if name_sim >= 0.92 and dist_km is not None and dist_km < 1.0:
            combined = max(combined, 0.90)

        if combined > best_score:
            best_score = combined
            best_place = place
            best_reason = f"name={name_sim:.2f},geo={geo_score:.2f},dist={dist_km}"

    if best_score >= 0.80:
        return best_place, best_score, best_reason
    return None, best_score, best_reason
