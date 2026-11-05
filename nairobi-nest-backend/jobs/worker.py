import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from jobs.queue import claim_next_job, enqueue_job
from jobs.tasks import (
    process_job,
    run_cleanup_catalog,
    run_ingest,
    run_prune_cache,
    run_reindex,
    run_refresh_stale,
)


def run_worker(task: str | None = None, source: str | None = None, max_jobs: int = 10):
    app = create_app()
    with app.app_context():
        if task == "ingest" and source:
            count = run_ingest(source)
            print(f"Ingested {count} records from {source}")
            return
        if task == "reindex":
            count = run_reindex()
            print(f"Reindexed {count} places")
            return
        if task == "refresh_stale":
            count = run_refresh_stale()
            print(f"Enqueued {count} stale refresh jobs")
            return
        if task == "cleanup_catalog":
            print(f"Unpublished {run_cleanup_catalog()} non-experience places")
            return
        if task == "prune_cache":
            result = run_prune_cache()
            print(f"Cache maintenance: {result}")
            return

        processed = 0
        while processed < max_jobs:
            job = claim_next_job()
            if not job:
                break
            process_job(job)
            processed += 1
        print(f"Processed {processed} jobs")


def main():
    parser = argparse.ArgumentParser(description="Kijiji ingestion worker")
    parser.add_argument("command", choices=["run", "enqueue"])
    parser.add_argument("--task", default=None)
    parser.add_argument("--source", default=None)
    parser.add_argument("--max-jobs", type=int, default=10)
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.command == "enqueue":
            enqueue_job(args.task or "ingest", {"source": args.source} if args.source else {})
            print("Job enqueued")
        else:
            run_worker(args.task, args.source, args.max_jobs)


if __name__ == "__main__":
    main()
