"""Prune expired SearchCache rows and unreferenced stale Place cache rows."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from flask import current_app
from sqlalchemy import or_

from app.models import Favorite, GuideBooking, ItineraryItem, Place, PlaceSource, SearchCache, db
from config import Config

logger = logging.getLogger(__name__)


def prune_expired_search_cache() -> int:
    """Delete SearchCache rows past expires_at (or TTL if expires_at was never set)."""
    now = datetime.utcnow()
    ttl = int(
        current_app.config.get("SEARCH_CACHE_TTL_SECONDS", Config.SEARCH_CACHE_TTL_SECONDS)
    )
    legacy_cutoff = now - timedelta(seconds=ttl)

    q = SearchCache.query.filter(
        or_(
            SearchCache.expires_at.isnot(None) & (SearchCache.expires_at < now),
            SearchCache.expires_at.is_(None) & (SearchCache.created_at < legacy_cutoff),
        )
    )
    # Also drop duplicate older rows for the same hashes (keep newest).
    deleted = q.delete(synchronize_session=False)
    db.session.commit()
    if deleted:
        logger.info("pruned %s expired search_cache rows", deleted)
    return deleted


def prune_stale_place_cache() -> int:
    """
    Unpublish Place cache rows that are stale and not referenced by user data.

    Does NOT delete favourites/itinerary/booking snapshots' FKs blindly —
    only touches places with no Favorite/ItineraryItem/GuideBooking reference
    and last_updated older than PLACE_CACHE_MAX_AGE_DAYS.
    """
    days = int(current_app.config.get("PLACE_CACHE_MAX_AGE_DAYS", 7))
    cutoff = datetime.utcnow() - timedelta(days=days)

    referenced_ids = set()
    for (pid,) in db.session.query(Favorite.place_id).filter(Favorite.place_id.isnot(None)):
        referenced_ids.add(pid)
    for (pid,) in db.session.query(ItineraryItem.place_id).filter(
        ItineraryItem.place_id.isnot(None)
    ):
        referenced_ids.add(pid)
    for (pid,) in db.session.query(GuideBooking.place_id).filter(
        GuideBooking.place_id.isnot(None)
    ):
        referenced_ids.add(pid)

    candidates = (
        Place.query.filter(
            Place.is_published.is_(True),
            Place.last_updated < cutoff,
        )
        .limit(500)
        .all()
    )
    unpublished = 0
    for place in candidates:
        if place.id in referenced_ids:
            continue
        # Keep explicit curated/bootstrap catalogue warm longer — only prune
        # rows that have at least one live ingest source and no user refs.
        source_names = {s.source_name for s in (place.sources or [])}
        live_sources = source_names & {"openstreetmap", "wikipedia", "rss"}
        if not live_sources:
            continue
        place.is_published = False
        unpublished += 1
    if unpublished:
        db.session.commit()
        logger.info("unpublished %s stale unreferenced Place cache rows", unpublished)
    return unpublished


def run_cache_maintenance() -> dict:
    return {
        "search_cache_deleted": prune_expired_search_cache(),
        "places_unpublished": prune_stale_place_cache(),
    }
