from datetime import datetime
from typing import Optional

from app.models import (
    IngestionQuarantine,
    Place,
    PlaceFreshness,
    PlaceMedia,
    PlaceSource,
    SourceRecordRaw,
    db,
)
from pipeline.deduplicator import find_duplicate_candidate
from pipeline.merger import compute_confidence, default_refresh_after, merge_place_data
from pipeline.normalizer import normalize_draft


def store_raw_record(raw) -> Optional[SourceRecordRaw]:
    existing = SourceRecordRaw.query.filter_by(
        source_name=raw.source_name, content_hash=raw.content_hash
    ).first()
    if existing:
        return existing
    record = SourceRecordRaw(
        source_name=raw.source_name,
        source_id=raw.source_id,
        source_url=raw.source_url,
        payload=raw.payload,
        content_hash=raw.content_hash,
        fetched_at=raw.fetched_at,
        status="pending",
    )
    db.session.add(record)
    db.session.flush()
    return record


def load_normalized_draft(draft, raw_record: Optional[SourceRecordRaw] = None) -> Place:
    data = normalize_draft(draft)
    reliability = draft.raw_confidence

    candidate, score, reason = find_duplicate_candidate(
        data["name"],
        data.get("latitude"),
        data.get("longitude"),
        data["source_name"],
        data["source_id"],
    )

    if candidate:
        place = merge_place_data(candidate, data, reliability, data["source_name"])
    else:
        slug = data["slug"]
        suffix = 1
        while Place.query.filter_by(slug=slug).first():
            slug = f"{data['slug']}-{suffix}"
            suffix += 1
        place = Place(
            name=data["name"],
            slug=slug,
            category=data["category"],
            description=data["description"],
            location_name=data["location_name"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            price_min=data["price_min"],
            price_max=data["price_max"],
            opening_hours=data["opening_hours"],
            tags=data["tags"],
            moods=data["moods"],
            companions=data["companions"],
            images=data["images"],
            action_url=data.get("action_url"),
            confidence_score=reliability,
            is_published=reliability >= 0.4,
            last_updated=datetime.utcnow(),
        )
        if place.latitude and place.longitude:
            place.google_maps_url = (
                f"https://www.google.com/maps/search/?api=1"
                f"&query={place.latitude},{place.longitude}"
            )
        db.session.add(place)
        db.session.flush()

    source = PlaceSource.query.filter_by(
        source_name=data["source_name"], source_id=data["source_id"]
    ).first()
    if not source:
        source = PlaceSource(
            place_id=place.id,
            source_name=data["source_name"],
            source_id=data["source_id"],
            source_url=data["source_url"],
            reliability_score=reliability,
            attribution_text=f"Data from {data['source_name']}",
            fetched_at=data["fetched_at"],
            raw_record_id=raw_record.id if raw_record else None,
        )
        db.session.add(source)
    else:
        source.fetched_at = data["fetched_at"]
        source.reliability_score = max(source.reliability_score, reliability)

    for idx, url in enumerate(data.get("images") or []):
        existing_media = PlaceMedia.query.filter_by(place_id=place.id, url=url).first()
        if not existing_media:
            db.session.add(
                PlaceMedia(
                    place_id=place.id,
                    url=url,
                    media_type="image",
                    source_name=data["source_name"],
                    is_primary=(idx == 0 and not place.images),
                    fetched_at=datetime.utcnow(),
                )
            )

    source_count = PlaceSource.query.filter_by(place_id=place.id).count()
    place.confidence_score = compute_confidence(place, source_count)

    freshness = PlaceFreshness.query.filter_by(place_id=place.id).first()
    if not freshness:
        freshness = PlaceFreshness(place_id=place.id)
        db.session.add(freshness)
    freshness.last_successful_ingest_at = datetime.utcnow()
    freshness.last_seen_at = datetime.utcnow()
    freshness.next_refresh_after = default_refresh_after(place.category or "cultural")

    if raw_record:
        raw_record.processed_at = datetime.utcnow()
        raw_record.status = "processed"

    db.session.commit()
    return place


def quarantine_record(source_name: str, source_id: str, payload, error: str):
    db.session.add(
        IngestionQuarantine(
            source_name=source_name,
            source_id=source_id,
            payload=payload,
            error_message=str(error)[:2000],
        )
    )
    db.session.commit()
