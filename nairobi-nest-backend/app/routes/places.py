from datetime import datetime, timedelta

from geopy.distance import geodesic
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import or_

from app.models import Place
from app.services.live_discovery import (
    discover_place_payloads,
    get_carousel_payloads,
    recent_cache_places,
)
from app.services.place_identity import resolve_place_ref
from config import Config

places_bp = Blueprint("places", __name__)


def _nearby_places(place, limit=4):
    ttl = current_app.config.get("SEARCH_CACHE_TTL_SECONDS", Config.SEARCH_CACHE_TTL_SECONDS)
    cutoff = datetime.utcnow() - timedelta(seconds=max(ttl, 3600))
    candidates = (
        Place.query.filter(Place.id != place.id, Place.is_published.is_(True))
        .filter(Place.latitude.isnot(None), Place.longitude.isnot(None))
        .filter(Place.last_updated >= cutoff)
        .limit(200)
        .all()
    )
    if len(candidates) < 4:
        candidates = (
            Place.query.filter(Place.id != place.id, Place.is_published.is_(True))
            .filter(Place.latitude.isnot(None), Place.longitude.isnot(None))
            .limit(200)
            .all()
        )
    scored = []
    for p in candidates:
        dist = geodesic(
            (place.latitude, place.longitude), (p.latitude, p.longitude)
        ).km
        scored.append((dist, p))
    scored.sort(key=lambda x: x[0])
    return [p.to_dict() for _, p in scored[:limit]]


@places_bp.route("/places", methods=["GET"])
def list_places():
    """
    List places from the short-lived cache window.
    trending / hidden_gem → carousel helper (live cache + curated_fallback if < 6).
    """
    if request.args.get("trending") == "true":
        payloads = get_carousel_payloads("trending", limit=request.args.get("per_page", 24, type=int))
        return jsonify({"places": payloads, "total": len(payloads), "source": "cache_window"}), 200

    if request.args.get("hidden_gem") == "true":
        payloads = get_carousel_payloads("hidden_gem", limit=request.args.get("per_page", 24, type=int))
        return jsonify({"places": payloads, "total": len(payloads), "source": "cache_window"}), 200

    # Intent-ish list: optional live discovery when q/lat provided
    q = request.args.get("q")
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    category = request.args.get("category")
    if q or (lat is not None and lon is not None):
        intent = {
            "q": q or "",
            "category": category or "",
            "latitude": lat,
            "longitude": lon,
        }
        payloads = discover_place_payloads(intent, limit=min(request.args.get("per_page", 50, type=int), 100))
        return jsonify({"places": payloads, "total": len(payloads), "source": "live_or_cache"}), 200

    # Default map/explore feed
    payloads = recent_cache_places(limit=min(request.args.get("per_page", 50, type=int), 100))

    mood = request.args.get("mood")
    if mood:
        payloads = [
            p for p in payloads if mood.lower() in [m.lower() for m in (p.get("moods") or [])]
        ]

    if category:
        payloads = [p for p in payloads if (p.get("category") or "").lower() == category.lower()]

    return jsonify({
        "places": payloads,
        "total": len(payloads),
        "page": 1,
        "per_page": len(payloads),
        "source": "cache_window",
    }), 200


@places_bp.route("/places/<path:place_ref>", methods=["GET"])
def get_place(place_ref):
    place = resolve_place_ref(place_ref)
    if place:
        data = place.to_dict(include_sources=True, include_media=True)
        data["nearby"] = _nearby_places(place)
        data["_resolved_via"] = (
            "numeric_id"
            if str(place_ref).isdigit()
            else ("place_key" if ":" in str(place_ref) or "%3A" in str(place_ref).upper() else "slug")
        )
        data["_request_ref"] = place_ref
        current_app.logger.info(
            "place_lookup ok ref=%r via=%s place_id=%s place_key=%s",
            place_ref,
            data["_resolved_via"],
            place.id,
            data.get("place_key"),
        )
        return jsonify(data), 200

    # Miss on Place cache: try recent SearchCache payloads
    from app.services.live_discovery import recent_cache_places
    from urllib.parse import unquote

    key = unquote(str(place_ref))
    for payload in recent_cache_places(limit=200):
        if payload.get("place_key") == key or payload.get("slug") == key:
            payload = dict(payload)
            payload["nearby"] = []
            payload["_resolved_via"] = "search_cache_payload"
            payload["_request_ref"] = place_ref
            return jsonify(payload), 200

    current_app.logger.info("place_lookup miss ref=%r", place_ref)
    return jsonify({"error": "Place not found"}), 404


@places_bp.route("/places/slug/<slug>", methods=["GET"])
def get_place_by_slug(slug):
    place = Place.query.filter_by(slug=slug).first_or_404()
    data = place.to_dict(include_sources=True, include_media=True)
    data["nearby"] = _nearby_places(place)
    return jsonify(data), 200


@places_bp.route("/places/<path:place_ref>/sources", methods=["GET"])
def get_place_sources(place_ref):
    place = resolve_place_ref(place_ref)
    if not place:
        return jsonify({"error": "Place not found"}), 404
    return jsonify({"sources": [s.to_dict() for s in place.sources]}), 200
