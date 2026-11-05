from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import uuid

from app.models import IngestionJob, db
from config import Config


def enqueue_job(
    task_type: str,
    payload: Optional[Dict[str, Any]] = None,
    priority: int = 0,
    run_after: Optional[datetime] = None,
) -> IngestionJob:
    job = IngestionJob(
        task_type=task_type,
        payload=payload or {},
        priority=priority,
        status="pending",
        max_attempts=Config.INGESTION_MAX_ATTEMPTS,
        run_after=run_after or datetime.utcnow(),
    )
    db.session.add(job)
    db.session.commit()
    return job


def reclaim_stale_jobs(timeout_minutes: int = 30):
    cutoff = datetime.utcnow() - timedelta(minutes=timeout_minutes)
    stale = IngestionJob.query.filter(
        IngestionJob.status == "running",
        IngestionJob.locked_at < cutoff,
    ).all()
    for job in stale:
        job.status = "pending"
        job.locked_at = None
        job.locked_by = None
    db.session.commit()


def claim_next_job(worker_id: Optional[str] = None) -> Optional[IngestionJob]:
    reclaim_stale_jobs()
    worker_id = worker_id or f"worker-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow()

    job = (
        IngestionJob.query.filter(
            IngestionJob.status == "pending",
            IngestionJob.run_after <= now,
        )
        .order_by(IngestionJob.priority.desc(), IngestionJob.created_at.asc())
        .with_for_update(skip_locked=True)
        .first()
        if Config.IS_POSTGRES
        else IngestionJob.query.filter(
            IngestionJob.status == "pending",
            IngestionJob.run_after <= now,
        )
        .order_by(IngestionJob.priority.desc(), IngestionJob.created_at.asc())
        .first()
    )

    if not job:
        return None

    job.status = "running"
    job.locked_at = now
    job.locked_by = worker_id
    job.attempts += 1
    db.session.commit()
    return job


def complete_job(job: IngestionJob):
    job.status = "completed"
    job.completed_at = datetime.utcnow()
    job.locked_at = None
    job.locked_by = None
    db.session.commit()


def fail_job(job: IngestionJob, error: str):
    job.last_error = str(error)[:2000]
    job.locked_at = None
    job.locked_by = None
    if job.attempts >= job.max_attempts:
        job.status = "dead"
    else:
        job.status = "pending"
        job.run_after = datetime.utcnow() + timedelta(minutes=2 ** job.attempts)
    db.session.commit()


def job_stats() -> Dict[str, int]:
    stats = {}
    for status in ("pending", "running", "completed", "failed", "dead"):
        stats[status] = IngestionJob.query.filter_by(status=status).count()
    return stats
