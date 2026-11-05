from sqlalchemy import text

from app.models import Favorite, ItineraryItem, Place, db


PLACE_NEW_COLUMNS = {
    "google_maps_url": "VARCHAR(500)",
    "social_refs": "JSON",
    "confidence_score": "FLOAT DEFAULT 0.5",
    "is_published": "BOOLEAN DEFAULT 1",
    "field_provenance": "JSON",
    "last_updated": "DATETIME",
    "embedding_updated_at": "DATETIME",
}

USER_NEW_COLUMNS = {
    "is_admin": "BOOLEAN DEFAULT 0",
}

FAVORITE_NEW_COLUMNS = {
    "place_key": "VARCHAR(280)",
    "name": "VARCHAR(200)",
    "description": "TEXT",
    "story": "TEXT",
    "image_url": "VARCHAR(500)",
    "location_name": "VARCHAR(200)",
    "source_name": "VARCHAR(80)",
    "source_id": "VARCHAR(200)",
    "source_url": "VARCHAR(500)",
    "latitude": "FLOAT",
    "longitude": "FLOAT",
    "category": "VARCHAR(50)",
    "price_min": "INTEGER",
    "price_max": "INTEGER",
    "snapshot": "JSON",
}

ITINERARY_ITEM_NEW_COLUMNS = {
    "place_key": "VARCHAR(280)",
    "name": "VARCHAR(200)",
    "description": "TEXT",
    "story": "TEXT",
    "image_url": "VARCHAR(500)",
    "location_name": "VARCHAR(200)",
    "source_name": "VARCHAR(80)",
    "source_id": "VARCHAR(200)",
    "source_url": "VARCHAR(500)",
    "latitude": "FLOAT",
    "longitude": "FLOAT",
    "category": "VARCHAR(50)",
    "price_min": "INTEGER",
    "price_max": "INTEGER",
    "snapshot": "JSON",
}

SEARCH_CACHE_NEW_COLUMNS = {
    "source": "VARCHAR(40)",
    "expires_at": "DATETIME",
}

GUIDE_BOOKING_NEW_COLUMNS = {
    "place_key": "VARCHAR(280)",
    "name": "VARCHAR(200)",
    "location_name": "VARCHAR(200)",
    "image_url": "VARCHAR(500)",
    "source_name": "VARCHAR(80)",
    "source_id": "VARCHAR(200)",
    "source_url": "VARCHAR(500)",
    "latitude": "FLOAT",
    "longitude": "FLOAT",
    "snapshot": "JSON",
    "phone_number": "VARCHAR(20)",
    "mpesa_receipt": "VARCHAR(50)",
    "payment_message": "VARCHAR(255)",
}


def _sqlite_columns(conn, table):
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _sqlite_table_exists(conn, table):
    row = conn.execute(
        text("SELECT name FROM sqlite_master WHERE type='table' AND name=:n"),
        {"n": table},
    ).fetchone()
    return bool(row)


def _add_columns(conn, table, columns):
    if not _sqlite_table_exists(conn, table):
        return
    existing = _sqlite_columns(conn, table)
    for col, typedef in columns.items():
        if col not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}"))


def migrate_sqlite_schema(app):
    """Add new columns to existing SQLite DB without Alembic."""
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if not uri.startswith("sqlite"):
        return

    with db.engine.connect() as conn:
        if _sqlite_table_exists(conn, "user"):
            user_cols = _sqlite_columns(conn, "user")
            for col, typedef in USER_NEW_COLUMNS.items():
                if col not in user_cols:
                    conn.execute(text(f"ALTER TABLE user ADD COLUMN {col} {typedef}"))

        if _sqlite_table_exists(conn, "place"):
            place_cols = _sqlite_columns(conn, "place")
            for col, typedef in PLACE_NEW_COLUMNS.items():
                if col not in place_cols:
                    conn.execute(text(f"ALTER TABLE place ADD COLUMN {col} {typedef}"))

        _add_columns(conn, "favorite", FAVORITE_NEW_COLUMNS)
        _add_columns(conn, "itinerary_item", ITINERARY_ITEM_NEW_COLUMNS)
        _add_columns(conn, "search_cache", SEARCH_CACHE_NEW_COLUMNS)
        _add_columns(conn, "guide_booking", GUIDE_BOOKING_NEW_COLUMNS)
        conn.commit()

    backfill_place_snapshots(app)


def backfill_place_snapshots(app):
    """Populate place_key + snapshot fields for existing favorites/itinerary items.

    Safe against unique (user_id, place_key): if two legacy rows would collide,
    keep the newest and delete/merge the duplicate instead of crashing startup.
    """
    from app.services.place_identity import snapshot_from_place

    with app.app_context():
        # Favourites: compute keys first, then apply with de-dupe.
        pending = []
        for fav in Favorite.query.order_by(Favorite.created_at.desc()).all():
            if fav.place_key and fav.snapshot:
                continue
            place = Place.query.get(fav.place_id) if fav.place_id else None
            if not place:
                continue
            pending.append((fav, snapshot_from_place(place)))

        seen = set()
        # Also treat already-keyed rows as occupying slots.
        for fav in Favorite.query.filter(Favorite.place_key.isnot(None)).all():
            seen.add((fav.user_id, fav.place_key))

        for fav, snap in pending:
            slot = (fav.user_id, snap["place_key"])
            if slot in seen:
                # Duplicate after key assignment — drop the older/extra row.
                db.session.delete(fav)
                continue
            fav.place_key = snap["place_key"]
            fav.name = snap.get("name")
            fav.description = snap.get("description")
            fav.story = snap.get("story")
            fav.image_url = snap.get("image") or (snap.get("images") or [None])[0]
            fav.location_name = snap.get("location_name")
            fav.source_name = snap.get("source_name")
            fav.source_id = snap.get("source_id")
            fav.source_url = snap.get("source_url")
            fav.latitude = snap.get("latitude")
            fav.longitude = snap.get("longitude")
            fav.category = snap.get("category")
            fav.price_min = snap.get("price_min")
            fav.price_max = snap.get("price_max")
            fav.snapshot = snap
            seen.add(slot)

        for item in ItineraryItem.query.all():
            if item.place_key and item.snapshot:
                continue
            place = Place.query.get(item.place_id) if item.place_id else None
            if not place:
                continue
            snap = snapshot_from_place(place)
            item.place_key = snap["place_key"]
            item.name = snap.get("name")
            item.description = snap.get("description")
            item.story = snap.get("story")
            item.image_url = snap.get("image") or (snap.get("images") or [None])[0]
            item.location_name = snap.get("location_name")
            item.source_name = snap.get("source_name")
            item.source_id = snap.get("source_id")
            item.source_url = snap.get("source_url")
            item.latitude = snap.get("latitude")
            item.longitude = snap.get("longitude")
            item.category = snap.get("category")
            item.price_min = snap.get("price_min")
            item.price_max = snap.get("price_max")
            item.snapshot = snap

        db.session.commit()


def ensure_postgres_extensions(app):
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if not uri.startswith("postgresql"):
        return
    try:
        with db.engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    except Exception:
        pass
    # Postgres: create_all adds new tables; ALTER missing columns via SQLAlchemy inspect.
    _ensure_postgres_snapshot_columns(app)
    backfill_place_snapshots(app)


def _ensure_postgres_snapshot_columns(app):
    from sqlalchemy import inspect

    with app.app_context():
        inspector = inspect(db.engine)
        with db.engine.connect() as conn:
            for table, columns in (
                ("favorite", FAVORITE_NEW_COLUMNS),
                ("itinerary_item", ITINERARY_ITEM_NEW_COLUMNS),
                ("search_cache", SEARCH_CACHE_NEW_COLUMNS),
                ("guide_booking", GUIDE_BOOKING_NEW_COLUMNS),
            ):
                if table not in inspector.get_table_names():
                    continue
                existing = {c["name"] for c in inspector.get_columns(table)}
                for col, typedef in columns.items():
                    if col not in existing:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}"))
            conn.commit()
