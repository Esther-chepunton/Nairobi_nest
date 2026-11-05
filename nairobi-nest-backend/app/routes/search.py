from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request

from app.models import Place, PlaceFreshness, User, db
from app.services.recommendation_engine import recommend_from_intent
from jobs.queue import enqueue_job, job_stats
from search.query_parser import parse_query

search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["POST"])
def search_places():
    data = request.get_json() or {}
    q = data.get("q", "")
    intent = {**data, "q": q}
    parsed = parse_query(q, intent)
    # Parsed hints (category, location, keywords) feed ranking; explicit fields win.
    intent = {**{k: v for k, v in parsed.items() if v}, **{k: v for k, v in intent.items() if v not in (None, "")}}

    user_prefs = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user = User.query.get(int(user_id))
            if user:
                user_prefs = user.preferences
    except Exception:
        pass

    results = recommend_from_intent(
        {**intent, "exclude_place_ids": data.get("exclude_place_ids") or []},
        user_prefs,
        limit=data.get("limit", 20),
    )

    return jsonify({
        "query": q,
        "parsed_intent": parsed,
        "places": results,
        "total": len(results),
    }), 200


@search_bp.route("/health/data", methods=["GET"])
def data_health():
    place_count = Place.query.filter_by(is_published=True).count()
    stale_count = PlaceFreshness.query.filter(
        PlaceFreshness.next_refresh_after <= datetime.utcnow()
    ).count()
    oldest = (
        Place.query.filter(Place.last_updated.isnot(None))
        .order_by(Place.last_updated.asc())
        .first()
    )
    return jsonify({
        "status": "ok",
        "published_places": place_count,
        "stale_places": stale_count,
        "oldest_update": oldest.last_updated.isoformat() if oldest and oldest.last_updated else None,
        "job_stats": job_stats(),
    }), 200


def _require_admin():
    user_id = get_jwt_identity()
    if not user_id:
        return None, (jsonify({"error": "Authentication required"}), 401)
    user = User.query.get(int(user_id))
    if not user or not user.is_admin:
        return None, (jsonify({"error": "Admin access required"}), 403)
    return user, None


@search_bp.route("/admin/ingest/status", methods=["GET"])
@jwt_required()
def ingest_status():
    _, err = _require_admin()
    if err:
        return err
    return jsonify({"jobs": job_stats()}), 200


@search_bp.route("/admin/ingest/trigger", methods=["POST"])
@jwt_required()
def trigger_ingest():
    _, err = _require_admin()
    if err:
        return err
    data = request.get_json() or {}
    source = data.get("source", "openstreetmap")
    task = data.get("task", "ingest")
    job = enqueue_job(task, {"source": source}, priority=10)
    return jsonify({"job_id": job.id, "status": job.status}), 202
