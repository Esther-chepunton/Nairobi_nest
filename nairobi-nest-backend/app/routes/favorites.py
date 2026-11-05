from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from urllib.parse import unquote

from app.models import Favorite, db
from app.services.place_identity import (
    favorite_place_view,
    resolve_place_ref,
    snapshot_from_client_payload,
)

favorites_bp = Blueprint("favorites", __name__)


def _apply_snapshot_fields(fav: Favorite, snap: dict):
    fav.place_key = snap["place_key"]
    fav.place_id = snap.get("legacy_place_id") or snap.get("id") or fav.place_id
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


@favorites_bp.route("/favorites", methods=["GET"])
@jwt_required()
def list_favorites():
    user_id = int(get_jwt_identity())
    favorites = Favorite.query.filter_by(user_id=user_id).order_by(Favorite.created_at.desc()).all()
    return jsonify({
        "favorites": [f.to_dict() for f in favorites if f.place_key or f.snapshot or f.place_id]
    }), 200


@favorites_bp.route("/favorites", methods=["POST"])
@jwt_required()
def add_favorite():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    place_ref = data.get("place_key") or data.get("place_id")
    place = resolve_place_ref(place_ref) if place_ref else None
    if place is None and isinstance(data.get("place"), dict):
        place = resolve_place_ref(
            data["place"].get("place_key") or data["place"].get("id")
        )

    try:
        snap = snapshot_from_client_payload(data, place)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    existing = Favorite.query.filter_by(user_id=user_id, place_key=snap["place_key"]).first()
    if not existing and place is not None:
        existing = Favorite.query.filter_by(user_id=user_id, place_id=place.id).first()

    if existing:
        _apply_snapshot_fields(existing, snap)
        db.session.commit()
        return jsonify({"message": "Already saved", "favorite": existing.to_dict()}), 200

    fav = Favorite(user_id=user_id)
    _apply_snapshot_fields(fav, snap)
    db.session.add(fav)
    db.session.commit()
    return jsonify({"message": "Saved", "favorite": fav.to_dict()}), 201


@favorites_bp.route("/favorites/<path:place_ref>", methods=["DELETE"])
@jwt_required()
def remove_favorite(place_ref):
    user_id = int(get_jwt_identity())
    ref = unquote(place_ref).strip()

    fav = Favorite.query.filter_by(user_id=user_id, place_key=ref).first()
    if not fav and ref.isdigit():
        fav = Favorite.query.filter_by(user_id=user_id, place_id=int(ref)).first()
    if not fav:
        place = resolve_place_ref(ref)
        if place:
            key = None
            try:
                from app.services.place_identity import place_key_from_place

                key = place_key_from_place(place)
            except Exception:
                pass
            if key:
                fav = Favorite.query.filter_by(user_id=user_id, place_key=key).first()
            if not fav:
                fav = Favorite.query.filter_by(user_id=user_id, place_id=place.id).first()

    if not fav:
        return jsonify({"error": "Favorite not found"}), 404
    db.session.delete(fav)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200


@favorites_bp.route("/favorites/check/<path:place_ref>", methods=["GET"])
@jwt_required()
def check_favorite(place_ref):
    user_id = int(get_jwt_identity())
    ref = unquote(place_ref).strip()

    saved = Favorite.query.filter_by(user_id=user_id, place_key=ref).first() is not None
    if not saved and ref.isdigit():
        saved = (
            Favorite.query.filter_by(user_id=user_id, place_id=int(ref)).first() is not None
        )
    if not saved:
        place = resolve_place_ref(ref)
        if place:
            from app.services.place_identity import place_key_from_place

            key = place_key_from_place(place)
            saved = (
                Favorite.query.filter_by(user_id=user_id, place_key=key).first() is not None
                or Favorite.query.filter_by(user_id=user_id, place_id=place.id).first()
                is not None
            )
    return jsonify({"saved": saved}), 200
