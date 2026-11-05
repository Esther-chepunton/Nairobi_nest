import secrets

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Itinerary, ItineraryItem, db
from app.services.place_identity import resolve_place_ref, snapshot_from_client_payload

itineraries_bp = Blueprint("itineraries", __name__)


def _apply_item_snapshot(item: ItineraryItem, snap: dict):
    item.place_key = snap["place_key"]
    item.place_id = snap.get("legacy_place_id") or snap.get("id") or item.place_id
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


@itineraries_bp.route("/itineraries", methods=["GET"])
@jwt_required()
def list_itineraries():
    user_id = int(get_jwt_identity())
    items = Itinerary.query.filter_by(user_id=user_id).order_by(Itinerary.created_at.desc()).all()
    return jsonify({"itineraries": [i.to_dict() for i in items]}), 200


@itineraries_bp.route("/itineraries", methods=["POST"])
@jwt_required()
def create_itinerary():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    title = data.get("title", "My Day Plan")
    itinerary = Itinerary(
        user_id=user_id,
        title=title,
        date=data.get("date"),
        total_budget_estimate=data.get("total_budget_estimate", 0),
        share_token=secrets.token_urlsafe(16),
    )
    db.session.add(itinerary)
    db.session.commit()
    return jsonify(itinerary.to_dict()), 201


@itineraries_bp.route("/itineraries/<int:itinerary_id>", methods=["GET"])
@jwt_required()
def get_itinerary(itinerary_id):
    user_id = int(get_jwt_identity())
    itinerary = Itinerary.query.filter_by(id=itinerary_id, user_id=user_id).first_or_404()
    return jsonify(itinerary.to_dict()), 200


@itineraries_bp.route("/itineraries/share/<token>", methods=["GET"])
def get_shared_itinerary(token):
    itinerary = Itinerary.query.filter_by(share_token=token).first_or_404()
    return jsonify(itinerary.to_dict()), 200


@itineraries_bp.route("/itineraries/<int:itinerary_id>/items", methods=["POST"])
@jwt_required()
def add_itinerary_item(itinerary_id):
    user_id = int(get_jwt_identity())
    itinerary = Itinerary.query.filter_by(id=itinerary_id, user_id=user_id).first_or_404()
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

    max_order = (
        db.session.query(db.func.max(ItineraryItem.sort_order))
        .filter_by(itinerary_id=itinerary_id)
        .scalar()
        or 0
    )

    item = ItineraryItem(
        itinerary_id=itinerary_id,
        sort_order=max_order + 1,
        time_slot=data.get("time_slot"),
        notes=data.get("notes"),
    )
    _apply_item_snapshot(item, snap)
    db.session.add(item)

    price = snap.get("price_max") or 0
    existing_total = sum(
        (i.price_max or (i.snapshot or {}).get("price_max") or 0) for i in itinerary.items
    )
    itinerary.total_budget_estimate = existing_total + price
    db.session.commit()
    return jsonify(itinerary.to_dict()), 201


@itineraries_bp.route("/itineraries/<int:itinerary_id>/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def remove_itinerary_item(itinerary_id, item_id):
    user_id = int(get_jwt_identity())
    itinerary = Itinerary.query.filter_by(id=itinerary_id, user_id=user_id).first_or_404()
    item = ItineraryItem.query.filter_by(id=item_id, itinerary_id=itinerary_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify(itinerary.to_dict()), 200
