from datetime import datetime
from typing import List

from app.models import Place, PlaceSearchDocument, db
from pipeline.embedder import embed_text


def _build_search_text(place: Place) -> str:
    parts = [
        place.name,
        place.description or "",
        place.story or "",
        place.location_name or "",
        place.category or "",
        " ".join(place.tags or []),
        " ".join(place.moods or []),
    ]
    return " ".join(p for p in parts if p)


def index_place(place: Place) -> PlaceSearchDocument:
    text = _build_search_text(place)
    embedding = embed_text(text)
    doc = PlaceSearchDocument.query.filter_by(place_id=place.id).first()
    if not doc:
        doc = PlaceSearchDocument(place_id=place.id)
        db.session.add(doc)
    doc.search_text = text
    doc.embedding = embedding
    doc.category = place.category
    doc.tags = place.tags or []
    doc.latitude = place.latitude
    doc.longitude = place.longitude
    doc.confidence_score = place.confidence_score or 0.5
    doc.updated_at = datetime.utcnow()
    place.embedding_updated_at = datetime.utcnow()
    db.session.commit()
    return doc


def index_all_places() -> int:
    places = Place.query.filter_by(is_published=True).all()
    for place in places:
        index_place(place)
    return len(places)
