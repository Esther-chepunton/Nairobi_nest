"""Search session persistence for resume-where-you-left-off."""

from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, make_response, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request

from app.models import SearchSession, db
from app.services.anon_identity import apply_anon_cookie, ensure_anon_id

search_sessions_bp = Blueprint("search_sessions", __name__)


def _optional_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity is not None:
            return int(identity)
    except Exception:
        pass
    return None


def _find_user_session(user_id):
    return (
        SearchSession.query.filter_by(user_id=user_id)
        .order_by(SearchSession.updated_at.desc())
        .first()
    )


def _find_anon_session(anon_id):
    return (
        SearchSession.query.filter_by(anon_id=anon_id, user_id=None)
        .order_by(SearchSession.updated_at.desc())
        .first()
    )


def _find_session(user_id, anon_id):
    if user_id is not None:
        user_session = _find_user_session(user_id)
        if user_session:
            return user_session
        # Logged in but no user-owned row yet — fall back to anon (pre-claim).
        return _find_anon_session(anon_id)
    return _find_anon_session(anon_id)


def _claim_anon_to_user(user_id, anon_id):
    """Reassign the anonymous SearchSession to the logged-in user (Booking.com-style)."""
    if not user_id or not anon_id:
        return None

    anon_session = _find_anon_session(anon_id)
    user_session = _find_user_session(user_id)

    if anon_session and user_session and anon_session.id != user_session.id:
        # Keep whichever was updated more recently; drop the other.
        if (anon_session.updated_at or datetime.min) >= (user_session.updated_at or datetime.min):
            anon_session.user_id = user_id
            db.session.delete(user_session)
            db.session.commit()
            return anon_session
        db.session.delete(anon_session)
        db.session.commit()
        return user_session

    if anon_session:
        anon_session.user_id = user_id
        db.session.commit()
        return anon_session

    return user_session


def _is_within_resume_window(session):
    if not session or not session.updated_at:
        return False
    if session.dismissed_at:
        return False
    hours = current_app.config.get("SEARCH_RESUME_HOURS", 48)
    return session.updated_at >= datetime.utcnow() - timedelta(hours=hours)


def _cookie_response(payload, status, anon_id, set_cookie):
    response = make_response(jsonify(payload), status)
    if set_cookie:
        apply_anon_cookie(response, anon_id)
    return response


@search_sessions_bp.route("/search-sessions", methods=["POST"])
def upsert_search_session():
    data = request.get_json() or {}
    anon_id, is_new = ensure_anon_id()
    user_id = _optional_user_id()

    if user_id is not None:
        session = _claim_anon_to_user(user_id, anon_id)
    else:
        session = _find_anon_session(anon_id)

    if not session:
        session = SearchSession(anon_id=anon_id, user_id=user_id)
        db.session.add(session)
    else:
        session.anon_id = anon_id
        if user_id is not None:
            session.user_id = user_id

    session.location = data.get("location") or data.get("q") or session.location
    session.q = data.get("q") or data.get("location") or session.q
    session.mood = data.get("mood") or session.mood
    session.companions = data.get("companions") or session.companions
    session.category = data.get("category") if "category" in data else session.category

    if "time_available_minutes" in data and data["time_available_minutes"] is not None:
        session.time_available_minutes = int(data["time_available_minutes"])
    if "budget_max" in data and data["budget_max"] is not None:
        session.budget_max = int(data["budget_max"])
    if "latitude" in data and data["latitude"] is not None:
        session.latitude = float(data["latitude"])
    if "longitude" in data and data["longitude"] is not None:
        session.longitude = float(data["longitude"])

    session.updated_at = datetime.utcnow()
    session.dismissed_at = None
    if not session.created_at:
        session.created_at = datetime.utcnow()

    db.session.commit()
    return _cookie_response({"session": session.to_dict()}, 200, anon_id, True)


@search_sessions_bp.route("/search-sessions/recent", methods=["GET"])
def get_recent_search_session():
    anon_id, is_new = ensure_anon_id()
    user_id = _optional_user_id()

    if user_id is not None:
        session = _claim_anon_to_user(user_id, anon_id)
    else:
        session = _find_anon_session(anon_id)

    if not _is_within_resume_window(session):
        return _cookie_response({"session": None}, 200, anon_id, True)

    return _cookie_response({"session": session.to_dict()}, 200, anon_id, True)


@search_sessions_bp.route("/search-sessions/claim", methods=["POST"])
@jwt_required()
def claim_search_session():
    """Explicit claim after login so anon resume attaches to the account."""
    anon_id, _ = ensure_anon_id()
    user_id = int(get_jwt_identity())
    session = _claim_anon_to_user(user_id, anon_id)
    if not _is_within_resume_window(session):
        return _cookie_response({"session": None, "claimed": False}, 200, anon_id, True)
    return _cookie_response(
        {"session": session.to_dict(), "claimed": True}, 200, anon_id, True
    )


@search_sessions_bp.route("/search-sessions/recent", methods=["DELETE"])
def dismiss_recent_search_session():
    anon_id, is_new = ensure_anon_id()
    user_id = _optional_user_id()
    session = _find_session(user_id, anon_id)
    if session:
        session.dismissed_at = datetime.utcnow()
        db.session.commit()
    return _cookie_response({"message": "Dismissed"}, 200, anon_id, True)
