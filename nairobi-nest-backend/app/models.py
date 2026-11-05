from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    preferences = db.Column(db.JSON, default=dict)
    visited_place_ids = db.Column(db.JSON, default=list)
    is_admin = db.Column(db.Boolean, default=False)

    favorites = db.relationship("Favorite", backref="user", lazy=True)
    itineraries = db.relationship("Itinerary", backref="user", lazy=True)
    guide_bookings = db.relationship("GuideBooking", backref="user", lazy=True)


class Place(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), unique=True, nullable=False)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    story = db.Column(db.Text)
    location_name = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    price_min = db.Column(db.Integer, default=0)
    price_max = db.Column(db.Integer, default=0)
    duration_minutes = db.Column(db.Integer, default=60)
    opening_hours = db.Column(db.JSON, default=dict)
    best_time = db.Column(db.String(100))
    tags = db.Column(db.JSON, default=list)
    moods = db.Column(db.JSON, default=list)
    companions = db.Column(db.JSON, default=list)
    highlights = db.Column(db.JSON, default=list)
    tips = db.Column(db.JSON, default=list)
    images = db.Column(db.JSON, default=list)
    action_type = db.Column(db.String(20), default="directions")
    action_url = db.Column(db.String(500))
    is_hidden_gem = db.Column(db.Boolean, default=False)
    is_trending = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=4.5)
    difficulty = db.Column(db.String(30))
    travel_time_from_nairobi = db.Column(db.String(50))
    google_maps_url = db.Column(db.String(500))
    social_refs = db.Column(db.JSON, default=list)
    confidence_score = db.Column(db.Float, default=0.5)
    is_published = db.Column(db.Boolean, default=True)
    field_provenance = db.Column(db.JSON, default=dict)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    embedding_updated_at = db.Column(db.DateTime)

    favorites = db.relationship("Favorite", backref="place", lazy=True)
    sources = db.relationship("PlaceSource", backref="place", lazy=True)
    media = db.relationship("PlaceMedia", backref="place", lazy=True)

    def google_maps_link(self):
        if self.google_maps_url:
            return self.google_maps_url
        if self.latitude is not None and self.longitude is not None:
            return (
                f"https://www.google.com/maps/search/?api=1"
                f"&query={self.latitude},{self.longitude}"
            )
        return None

    @staticmethod
    def _as_list(value, split_words=False):
        """Coerce JSON/list fields that may have been stored as strings in SQLite."""
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

    def to_dict(self, include_nearby=False, include_sources=False, include_media=False):
        from app.services.place_identity import place_key_from_place

        images = self._as_list(self.images)
        data = {
            "id": self.id,
            "place_key": place_key_from_place(self),
            "name": self.name,
            "slug": self.slug,
            "category": self.category,
            "description": self.description,
            "story": self.story,
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "price_min": self.price_min,
            "price_max": self.price_max,
            "duration_minutes": self.duration_minutes,
            "opening_hours": self.opening_hours or {},
            "best_time": self.best_time,
            "tags": self._as_list(self.tags),
            "moods": self._as_list(self.moods),
            "companions": self._as_list(self.companions, split_words=True),
            "highlights": self._as_list(self.highlights),
            "tips": self._as_list(self.tips),
            "images": images,
            "action_type": self.action_type,
            "action_url": self.action_url,
            "is_hidden_gem": self.is_hidden_gem,
            "is_trending": self.is_trending,
            "rating": self.rating,
            "difficulty": self.difficulty,
            "travel_time_from_nairobi": self.travel_time_from_nairobi,
            "google_maps_url": self.google_maps_link(),
            "social_refs": self.social_refs or [],
            "confidence_score": self.confidence_score,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }
        if images:
            data["image"] = images[0]
        if include_sources:
            data["sources"] = [s.to_dict() for s in self.sources]
        if include_media:
            data["media"] = [m.to_dict() for m in self.media]
        return data


class PlaceSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), nullable=False)
    source_name = db.Column(db.String(80), nullable=False)
    source_id = db.Column(db.String(200))
    source_url = db.Column(db.String(500))
    reliability_score = db.Column(db.Float, default=0.5)
    attribution_text = db.Column(db.String(300))
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)
    raw_record_id = db.Column(db.Integer, db.ForeignKey("source_record_raw.id"))

    __table_args__ = (
        db.UniqueConstraint("source_name", "source_id", name="uq_place_source"),
    )

    def to_dict(self):
        return {
            "source_name": self.source_name,
            "source_id": self.source_id,
            "source_url": self.source_url,
            "reliability_score": self.reliability_score,
            "attribution_text": self.attribution_text,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
        }


class PlaceMedia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    media_type = db.Column(db.String(20), default="image")
    source_name = db.Column(db.String(80))
    license = db.Column(db.String(100))
    attribution_text = db.Column(db.String(300))
    is_primary = db.Column(db.Boolean, default=False)
    width = db.Column(db.Integer)
    height = db.Column(db.Integer)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "media_type": self.media_type,
            "source_name": self.source_name,
            "license": self.license,
            "attribution_text": self.attribution_text,
            "is_primary": self.is_primary,
        }


class SourceRecordRaw(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source_name = db.Column(db.String(80), nullable=False)
    source_id = db.Column(db.String(200), nullable=False)
    source_url = db.Column(db.String(500))
    payload = db.Column(db.JSON, nullable=False)
    content_hash = db.Column(db.String(64), nullable=False)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="pending")

    __table_args__ = (
        db.UniqueConstraint("source_name", "content_hash", name="uq_raw_content_hash"),
    )


class IngestionJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_type = db.Column(db.String(50), nullable=False)
    payload = db.Column(db.JSON, default=dict)
    priority = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="pending")
    attempts = db.Column(db.Integer, default=0)
    max_attempts = db.Column(db.Integer, default=5)
    run_after = db.Column(db.DateTime, default=datetime.utcnow)
    locked_at = db.Column(db.DateTime)
    locked_by = db.Column(db.String(100))
    last_error = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)


class IngestionQuarantine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source_name = db.Column(db.String(80))
    source_id = db.Column(db.String(200))
    payload = db.Column(db.JSON)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PlaceSearchDocument(db.Model):
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), primary_key=True)
    search_text = db.Column(db.Text)
    embedding = db.Column(db.JSON)
    category = db.Column(db.String(50))
    tags = db.Column(db.JSON, default=list)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    confidence_score = db.Column(db.Float, default=0.5)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    place = db.relationship("Place", backref=db.backref("search_document", uselist=False))


class SearchCache(db.Model):
    """Short-lived discovery cache. `results` holds full place payloads (dicts), not permanent IDs."""

    id = db.Column(db.Integer, primary_key=True)
    query_hash = db.Column(db.String(64), nullable=False, index=True)
    intent_hash = db.Column(db.String(64), nullable=False, index=True)
    # New shape: list[dict] place payloads. Legacy rows may still be list[int] place ids.
    results = db.Column(db.JSON, nullable=False)
    source = db.Column(db.String(40), default="live")  # live | curated_fallback | mixed
    expires_at = db.Column(db.DateTime, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SearchSession(db.Model):
    """Most recent discovery intent for resume-where-you-left-off (48h window)."""

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    anon_id = db.Column(db.String(64), nullable=False, index=True)
    location = db.Column(db.String(200))
    q = db.Column(db.String(200))
    mood = db.Column(db.String(50))
    time_available_minutes = db.Column(db.Integer)
    budget_max = db.Column(db.Integer)
    companions = db.Column(db.String(50))
    category = db.Column(db.String(50))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dismissed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "location": self.location,
            "q": self.q,
            "mood": self.mood,
            "time_available_minutes": self.time_available_minutes,
            "budget_max": self.budget_max,
            "companions": self.companions,
            "category": self.category,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PlaceFreshness(db.Model):
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), primary_key=True)
    last_seen_at = db.Column(db.DateTime)
    last_successful_ingest_at = db.Column(db.DateTime)
    next_refresh_after = db.Column(db.DateTime)
    stale_fields = db.Column(db.JSON, default=list)

    place = db.relationship("Place", backref=db.backref("freshness", uselist=False))


class PlaceDuplicate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    canonical_place_id = db.Column(db.Integer, db.ForeignKey("place.id"), nullable=False)
    merged_place_id = db.Column(db.Integer)
    merge_reason = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class RateLimitState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.String(200), unique=True, nullable=False)
    tokens = db.Column(db.Float, default=10.0)
    last_refill = db.Column(db.DateTime, default=datetime.utcnow)


class RobotsCache(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.String(200), unique=True, nullable=False)
    allowed = db.Column(db.Boolean, default=True)
    rules = db.Column(db.JSON, default=dict)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    # Stable identity: "wikipedia:12345" — primary reference going forward.
    place_key = db.Column(db.String(280), nullable=True, index=True)
    # Legacy cache FK (nullable once Place is cache-only).
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), nullable=True)
    name = db.Column(db.String(200))
    description = db.Column(db.Text)
    story = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    location_name = db.Column(db.String(200))
    source_name = db.Column(db.String(80))
    source_id = db.Column(db.String(200))
    source_url = db.Column(db.String(500))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    category = db.Column(db.String(50))
    price_min = db.Column(db.Integer)
    price_max = db.Column(db.Integer)
    snapshot = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "place_key", name="uq_favorite_user_place_key"),)

    def to_dict(self):
        from app.services.place_identity import favorite_place_view

        return {
            "id": self.id,
            "place_key": self.place_key,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "saved_at": (self.snapshot or {}).get("saved_at")
            or (self.created_at.isoformat() if self.created_at else None),
            "source_name": self.source_name,
            "source_url": self.source_url,
            "place": favorite_place_view(self),
        }


class Itinerary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(20))
    total_budget_estimate = db.Column(db.Integer, default=0)
    share_token = db.Column(db.String(64), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship(
        "ItineraryItem", backref="itinerary", lazy=True, order_by="ItineraryItem.sort_order"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "date": self.date,
            "total_budget_estimate": self.total_budget_estimate,
            "share_token": self.share_token,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.items],
        }


class ItineraryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    itinerary_id = db.Column(db.Integer, db.ForeignKey("itinerary.id"), nullable=False)
    place_key = db.Column(db.String(280), nullable=True, index=True)
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    time_slot = db.Column(db.String(50))
    notes = db.Column(db.String(500))
    name = db.Column(db.String(200))
    description = db.Column(db.Text)
    story = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    location_name = db.Column(db.String(200))
    source_name = db.Column(db.String(80))
    source_id = db.Column(db.String(200))
    source_url = db.Column(db.String(500))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    category = db.Column(db.String(50))
    price_min = db.Column(db.Integer)
    price_max = db.Column(db.Integer)
    snapshot = db.Column(db.JSON, default=dict)

    place = db.relationship("Place")

    def to_dict(self):
        from app.services.place_identity import itinerary_item_place_view

        return {
            "id": self.id,
            "place_key": self.place_key,
            "place_id": self.place_id,
            "sort_order": self.sort_order,
            "time_slot": self.time_slot,
            "notes": self.notes,
            "place": itinerary_item_place_view(self),
        }


class Guide(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text)
    languages = db.Column(db.JSON, default=list)
    specialties = db.Column(db.JSON, default=list)
    price_per_hour = db.Column(db.Integer, default=2000)
    rating = db.Column(db.Float, default=4.8)
    review_count = db.Column(db.Integer, default=0)
    avatar_url = db.Column(db.String(500))
    is_available = db.Column(db.Boolean, default=True)

    bookings = db.relationship("GuideBooking", backref="guide", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "bio": self.bio,
            "languages": self.languages or [],
            "specialties": self.specialties or [],
            "price_per_hour": self.price_per_hour,
            "rating": self.rating,
            "review_count": self.review_count,
            "avatar_url": self.avatar_url,
            "is_available": self.is_available,
        }


class GuideBooking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    guide_id = db.Column(db.Integer, db.ForeignKey("guide.id"), nullable=False)
    # Snapshot + stable key (Step 4). place_id kept nullable for legacy rows only.
    # M-Pesa callback never reads place_id — only booking.id / status / mpesa_checkout_id.
    place_key = db.Column(db.String(280), nullable=True, index=True)
    place_id = db.Column(db.Integer, db.ForeignKey("place.id"), nullable=True)
    name = db.Column(db.String(200))
    location_name = db.Column(db.String(200))
    image_url = db.Column(db.String(500))
    source_name = db.Column(db.String(80))
    source_id = db.Column(db.String(200))
    source_url = db.Column(db.String(500))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    snapshot = db.Column(db.JSON, default=dict)
    date = db.Column(db.String(20), nullable=False)
    duration_hours = db.Column(db.Float, default=2)
    amount = db.Column(db.Float, nullable=False)
    mpesa_checkout_id = db.Column(db.String(100), index=True)
    # pending -> awaiting_payment -> confirmed | failed | cancelled
    status = db.Column(db.String(50), default="pending")
    phone_number = db.Column(db.String(20))
    mpesa_receipt = db.Column(db.String(50))
    payment_message = db.Column(db.String(255))

    place = db.relationship("Place")

    def to_dict(self):
        place_view = None
        if self.snapshot:
            place_view = dict(self.snapshot)
            place_view["place_key"] = self.place_key or place_view.get("place_key")
        elif self.place:
            place_view = self.place.to_dict()
        elif self.place_key or self.name:
            place_view = {
                "place_key": self.place_key,
                "name": self.name,
                "location_name": self.location_name,
                "image": self.image_url,
                "images": [self.image_url] if self.image_url else [],
                "source_name": self.source_name,
                "source_url": self.source_url,
                "latitude": self.latitude,
                "longitude": self.longitude,
                "id": self.place_id,
            }
        return {
            "id": self.id,
            "guide_id": self.guide_id,
            "place_key": self.place_key,
            "place_id": self.place_id,
            "date": self.date,
            "duration_hours": self.duration_hours,
            "amount": self.amount,
            "status": self.status,
            "mpesa_receipt": self.mpesa_receipt,
            "payment_message": self.payment_message,
            "guide": self.guide.to_dict() if self.guide else None,
            "place": place_view,
        }
