from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Guide, GuideBooking, db
from app.services.place_identity import (
    resolve_place_ref,
    snapshot_from_client_payload,
    snapshot_from_place,
)

guides_bp = Blueprint("guides", __name__)


def _apply_booking_place_snapshot(booking: GuideBooking, snap: dict | None):
    if not snap:
        return
    booking.place_key = snap.get("place_key")
    booking.place_id = snap.get("legacy_place_id") or snap.get("id") or booking.place_id
    booking.name = snap.get("name")
    booking.location_name = snap.get("location_name")
    booking.image_url = snap.get("image") or (snap.get("images") or [None])[0]
    booking.source_name = snap.get("source_name")
    booking.source_id = snap.get("source_id")
    booking.source_url = snap.get("source_url")
    booking.latitude = snap.get("latitude")
    booking.longitude = snap.get("longitude")
    booking.snapshot = snap


@guides_bp.route("/guides", methods=["GET"])
def list_guides():
    query = Guide.query.filter_by(is_available=True)
    specialty = request.args.get("specialty")
    if specialty:
        guides = query.all()
        filtered = [
            g for g in guides
            if specialty.lower() in [s.lower() for s in (g.specialties or [])]
        ]
        return jsonify({"guides": [g.to_dict() for g in filtered]}), 200
    return jsonify({"guides": [g.to_dict() for g in query.all()]}), 200


@guides_bp.route("/guides/<int:guide_id>", methods=["GET"])
def get_guide(guide_id):
    guide = Guide.query.get_or_404(guide_id)
    return jsonify(guide.to_dict()), 200


@guides_bp.route("/guide-bookings", methods=["POST"])
@jwt_required()
def create_guide_booking():
    """
    Create booking + optional place snapshot.
    M-Pesa routes are untouched: they only use booking.id / status / mpesa_checkout_id.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    guide_id = data.get("guide_id")
    date = data.get("date")
    duration_hours = data.get("duration_hours", 2)

    if not guide_id or not date:
        return jsonify({"error": "guide_id and date are required"}), 400
    try:
        booking_date = datetime.strptime(str(date), "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "date must be YYYY-MM-DD"}), 400
    if booking_date < datetime.utcnow().date():
        return jsonify({"error": "Pick a date from today onwards"}), 400
    try:
        duration_hours = float(duration_hours)
    except (TypeError, ValueError):
        return jsonify({"error": "duration_hours must be a number"}), 400
    if not 1 <= duration_hours <= 12:
        return jsonify({"error": "duration_hours must be between 1 and 12"}), 400

    guide = Guide.query.get_or_404(guide_id)
    amount = guide.price_per_hour * duration_hours

    snap = None
    place_ref = data.get("place_key") or data.get("place_id")
    place = resolve_place_ref(place_ref) if place_ref else None
    if place is None and isinstance(data.get("place"), dict):
        place = resolve_place_ref(
            data["place"].get("place_key") or data["place"].get("id")
        )
    if place is not None or data.get("place_key") or isinstance(data.get("place"), dict):
        try:
            snap = snapshot_from_client_payload(data, place)
        except ValueError:
            snap = snapshot_from_place(place) if place else None

    booking = GuideBooking(
        user_id=user_id,
        guide_id=guide_id,
        place_id=(snap or {}).get("legacy_place_id") or (snap or {}).get("id") or data.get("place_id"),
        date=date,
        duration_hours=duration_hours,
        amount=amount,
        status="pending",
    )
    _apply_booking_place_snapshot(booking, snap)
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking.to_dict()), 201


@guides_bp.route("/guide-bookings", methods=["GET"])
@jwt_required()
def list_guide_bookings():
    user_id = int(get_jwt_identity())
    bookings = GuideBooking.query.filter_by(user_id=user_id).order_by(GuideBooking.id.desc()).all()
    return jsonify({"bookings": [b.to_dict() for b in bookings]}), 200
