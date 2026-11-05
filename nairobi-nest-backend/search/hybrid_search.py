"""Discovery candidate search — prefers live fetch + SearchCache payloads over permanent catalog."""

import logging
from typing import Any, Dict, List

from app.models import Place
from app.services.live_discovery import discover_places, get_cached_payloads
from search.query_parser import parse_query

logger = logging.getLogger(__name__)


def hybrid_search(
    intent: Dict[str, Any],
    limit: int = 100,
    use_cache: bool = True,
) -> List[Place]:
    """
    Return Place cache rows for an intent.

    Step 3: live OSM/Wikipedia/RSS (scoped) → upsert into Place cache →
    store full payloads in SearchCache (TTL). Cron ingest jobs still warm the same table.
    """
    parsed = parse_query(intent.get("q", ""), intent)
    merged = {**intent, **{k: v for k, v in parsed.items() if v}}

    try:
        places = discover_places(merged, limit=limit)
        if places:
            return places
    except Exception as exc:
        logger.warning("live discovery failed, falling back to warm Place rows: %s", exc)

    # Fallback: any warm published Place rows (still cache, not seed-as-truth)
    query = Place.query.filter_by(is_published=True)
    if merged.get("category"):
        query = query.filter(Place.category == merged["category"])
    q = merged.get("q")
    if q:
        like = f"%{q}%"
        query = query.filter(
            Place.name.ilike(like)
            | Place.description.ilike(like)
            | Place.location_name.ilike(like)
        )
    return query.order_by(Place.last_updated.desc()).limit(limit).all()
