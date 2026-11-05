from datetime import datetime

from app.models import Place, PlaceFreshness, PlaceSearchDocument, db
from ingestion.registry import get_adapter, list_enabled_adapters
from jobs.queue import complete_job, enqueue_job, fail_job
from pipeline.embedder import embed_text
from pipeline.loader import load_normalized_draft, quarantine_record, store_raw_record
from search.indexer import index_all_places, index_place


def run_ingest(source_name: str, cursor=None):
    adapter = get_adapter(source_name)
    records, next_cursor = adapter.fetch(cursor)
    processed = 0
    for raw in records:
        try:
            raw_record = store_raw_record(raw)
            if raw_record.status == "processed":
                continue
            draft = adapter.normalize(raw)
            if not draft:
                raw_record.status = "skipped"
                db.session.commit()
                continue
            load_normalized_draft(draft, raw_record)
            processed += 1
        except Exception as exc:
            quarantine_record(raw.source_name, raw.source_id, raw.payload, str(exc))
    db.session.commit()
    if next_cursor:
        enqueue_job("ingest", {"source": source_name, "cursor": next_cursor}, priority=1)
    return processed


def run_reindex():
    return index_all_places()


def run_refresh_stale():
    now = datetime.utcnow()
    stale = PlaceFreshness.query.filter(PlaceFreshness.next_refresh_after <= now).limit(50).all()
    enqueued = 0
    for entry in stale:
        sources = [s.source_name for s in entry.place.sources]
        for source in sources or list_enabled_adapters():
            enqueue_job("ingest", {"source": source}, priority=0)
            enqueued += 1
            break
    return enqueued


def run_media_backfill():
    places = Place.query.filter(Place.images != None).limit(100).all()  # noqa: E711
    count = 0
    for place in places:
        if place.images:
            index_place(place)
            count += 1
    return count


def run_on_demand_fetch(intent: dict):
    for source in list_enabled_adapters()[:2]:
        enqueue_job("ingest", {"source": source, "intent": intent}, priority=5)


def run_cleanup_catalog():
    """Unpublish places that aren't visitable experiences (countries, airports, hotels...).

    Ingestion now filters these out; this cleans rows stored before that filter existed.
    Curated seed places are never touched.
    """
    from pipeline.normalizer import is_discoverable

    hidden = 0
    for place in Place.query.filter(Place.is_published.is_(True)).all():
        if getattr(place, "source_name", None) in ("bootstrap", "curated_fallback"):
            continue
        if not is_discoverable(place.name, place.description or ""):
            place.is_published = False
            hidden += 1
    db.session.commit()
    return hidden


def run_prune_cache():
    from app.services.cache_maintenance import run_cache_maintenance

    return run_cache_maintenance()


def process_job(job):
    task = job.task_type
    payload = job.payload or {}
    try:
        if task == "ingest":
            source = payload.get("source")
            if not source:
                raise ValueError("Missing source in ingest job")
            count = run_ingest(source, payload.get("cursor"))
            complete_job(job)
            return count
        if task == "reindex":
            count = run_reindex()
            complete_job(job)
            return count
        if task == "refresh_stale":
            count = run_refresh_stale()
            complete_job(job)
            return count
        if task == "media_backfill":
            count = run_media_backfill()
            complete_job(job)
            return count
        if task == "on_demand_fetch":
            run_on_demand_fetch(payload.get("intent", {}))
            complete_job(job)
            return 0
        if task == "prune_cache":
            result = run_prune_cache()
            complete_job(job)
            return result
        raise ValueError(f"Unknown task: {task}")
    except Exception as exc:
        fail_job(job, str(exc))
        raise
