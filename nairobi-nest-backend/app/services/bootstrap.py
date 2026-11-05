import json
import os
from datetime import datetime

from app.models import (
    Guide,
    Place,
    PlaceFreshness,
    PlaceMedia,
    PlaceSearchDocument,
    PlaceSource,
    db,
)
from search.indexer import index_place

GUIDES = [
    {
        "name": "James Mwangi",
        "bio": "Nature guide with 8 years exploring Kenya's forests and waterfalls.",
        "languages": ["English", "Swahili"],
        "specialties": ["Nature", "Hiking", "Bird watching"],
        "price_per_hour": 2500,
        "rating": 4.9,
        "review_count": 47,
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    },
    {
        "name": "Amina Hassan",
        "bio": "Cultural guide passionate about Nairobi's markets, museums, and hidden history.",
        "languages": ["English", "Swahili", "Arabic"],
        "specialties": ["Culture", "Markets", "Food"],
        "price_per_hour": 2000,
        "rating": 4.8,
        "review_count": 62,
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    {
        "name": "Peter Kipchoge",
        "bio": "Adventure guide specializing in Ngong Hills and Rift Valley treks.",
        "languages": ["English", "Swahili", "Kalenjin"],
        "specialties": ["Adventure", "Hiking", "Photography"],
        "price_per_hour": 3000,
        "rating": 4.9,
        "review_count": 38,
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    },
    {
        "name": "Grace Wanjiku",
        "bio": "Photography guide helping you capture Kenya's most stunning landscapes.",
        "languages": ["English", "Swahili"],
        "specialties": ["Photography", "Nature", "Sunset spots"],
        "price_per_hour": 3500,
        "rating": 4.7,
        "review_count": 29,
        "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    },
    {
        "name": "David Ochieng",
        "bio": "Wildlife expert with deep knowledge of Nairobi National Park and surrounds.",
        "languages": ["English", "Swahili"],
        "specialties": ["Wildlife", "Safari", "Conservation"],
        "price_per_hour": 4000,
        "rating": 5.0,
        "review_count": 55,
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    },
]


def _backfill_place_metadata():
    updated = False
    for place in Place.query.all():
        if not place.confidence_score or place.confidence_score < 0.9:
            place.confidence_score = 0.95
            updated = True
        if not place.last_updated:
            place.last_updated = datetime.utcnow()
            updated = True
        if place.is_published is None:
            place.is_published = True
            updated = True
    if updated:
        db.session.commit()


def _backfill_sources_for_existing_places():
    """Add source attribution to places created before the ingestion migration."""
    if PlaceSource.query.first():
        return
    for place in Place.query.all():
        db.session.add(
            PlaceSource(
                place_id=place.id,
                source_name="manual_bootstrap",
                source_id=place.slug,
                source_url="https://kijiji.local/bootstrap",
                reliability_score=0.95,
                attribution_text="Curated bootstrap data (migrated from legacy seed)",
                fetched_at=datetime.utcnow(),
            )
        )
        if not PlaceFreshness.query.filter_by(place_id=place.id).first():
            db.session.add(
                PlaceFreshness(
                    place_id=place.id,
                    last_seen_at=datetime.utcnow(),
                    last_successful_ingest_at=datetime.utcnow(),
                    next_refresh_after=datetime.utcnow(),
                )
            )
        if not PlaceSearchDocument.query.filter_by(place_id=place.id).first():
            index_place(place)
    db.session.commit()


def bootstrap_catalog():
    """One-time bootstrap from legacy seed file into canonical DB with source attribution."""
    _backfill_place_metadata()
    if Place.query.first():
        _backfill_sources_for_existing_places()
        return

    seed_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data",
        "places_seed.json",
    )
    if not os.path.exists(seed_path):
        return

    with open(seed_path, "r", encoding="utf-8") as f:
        places_data = json.load(f)

    for p in places_data:
        place = Place(
            **{k: v for k, v in p.items() if k not in ("id",)},
            confidence_score=0.95,
            is_published=True,
            last_updated=datetime.utcnow(),
        )
        if place.latitude and place.longitude:
            place.google_maps_url = (
                f"https://www.google.com/maps/search/?api=1"
                f"&query={place.latitude},{place.longitude}"
            )
        db.session.add(place)
        db.session.flush()

        db.session.add(
            PlaceSource(
                place_id=place.id,
                source_name="manual_bootstrap",
                source_id=place.slug,
                source_url="https://kijiji.local/bootstrap",
                reliability_score=0.95,
                attribution_text="Curated bootstrap data (migrated from legacy seed)",
                fetched_at=datetime.utcnow(),
            )
        )
        for idx, url in enumerate(place.images or []):
            db.session.add(
                PlaceMedia(
                    place_id=place.id,
                    url=url,
                    media_type="image",
                    source_name="manual_bootstrap",
                    is_primary=(idx == 0),
                    fetched_at=datetime.utcnow(),
                )
            )
        db.session.add(
            PlaceFreshness(
                place_id=place.id,
                last_seen_at=datetime.utcnow(),
                last_successful_ingest_at=datetime.utcnow(),
                next_refresh_after=datetime.utcnow(),
            )
        )
        index_place(place)

    for g in GUIDES:
        if not Guide.query.filter_by(name=g["name"]).first():
            db.session.add(Guide(**g))

    db.session.commit()
