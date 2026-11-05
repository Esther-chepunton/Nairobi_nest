from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request

from app.models import Place, User
from app.services.recommendation_engine import recommend_from_intent

recommendations_bp = Blueprint("recommendations", __name__)


def _get_user_preferences():
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            user = User.query.get(int(user_id))
            if user:
                prefs = user.preferences or {}
                if user.visited_place_ids:
                    prefs = {**prefs, "visited_place_ids": user.visited_place_ids}
                return prefs, user.visited_place_ids or []
    except Exception:
        pass
    return None, []


@recommendations_bp.route("/recommendations", methods=["POST"])
def get_recommendations():
    data = request.get_json() or {}
    user_prefs, visited = _get_user_preferences()

    exclude = data.get("exclude_place_ids") or []
    if visited:
        exclude = list(set(exclude + visited))
    data["exclude_place_ids"] = exclude

    results = recommend_from_intent(data, user_prefs)
    return jsonify({"places": results}), 200


@recommendations_bp.route("/recommendations/explain", methods=["POST"])
def explain_recommendations():
    data = request.get_json() or {}
    user_prefs, visited = _get_user_preferences()
    exclude = data.get("exclude_place_ids") or []
    if visited:
        exclude = list(set(exclude + visited))
    data["exclude_place_ids"] = exclude

    results = recommend_from_intent(data, user_prefs, limit=5)
    mood = data.get("mood", "exploring")
    budget = data.get("budget_max")
    time_min = data.get("time_available_minutes")
    query = data.get("q")

    parts = []
    if query:
        parts.append(f'For "{query}"')
    parts.append(f"based on your {mood} mood")
    if budget:
        parts.append(f"KSh {budget:,} budget")
    if time_min:
        parts.append(f"{time_min // 60}h available" if time_min >= 60 else f"{time_min}min available")

    summary = ", ".join(parts) + f", here are {len(results)} experiences we'd recommend."

    weather = data.get("weather")
    if weather and weather.lower() in ("rain", "rainy", "storm"):
        indoor = [r for r in results if "indoor" in (r["place"].get("tags") or [])]
        if indoor:
            summary += " Rain expected — we've prioritised indoor-friendly spots."

    if results and results[0]["place"].get("sources"):
        src = results[0]["place"]["sources"][0]
        if src.get("source_name"):
            summary += f" Data aggregated from {src['source_name']}."

    return jsonify({"places": results, "summary": summary}), 200
