"""M-Pesa (Safaricom Daraja) STK Push for guide bookings.

Flow:
1. POST /api/guide-bookings            -> booking (status "pending")
2. POST /api/mpesa-payment             -> STK push sent to the phone (status "awaiting_payment")
3. Safaricom POSTs /api/mpesa-callback -> status "confirmed" / "failed" / "cancelled"
4. GET  /api/guide-bookings/<id>/payment-status
   The frontend polls this. While a booking is still awaiting payment it also asks
   Daraja directly (STK Push Query), so payments confirm even when Safaricom
   cannot reach the callback URL (e.g. local development on localhost).
"""

import base64
import logging
import re
from datetime import datetime

import requests
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import GuideBooking, db

mpesa_router = Blueprint("mpesa", __name__)
logger = logging.getLogger(__name__)

# Daraja result codes worth naming for the user.
RESULT_MESSAGES = {
    0: "Payment received",
    1: "Insufficient M-Pesa balance",
    1032: "Payment cancelled on the phone",
    1037: "No response from the phone. Please try again",
    2001: "Wrong M-Pesa PIN entered",
}
CANCELLED_CODES = {1032}
# STK Query answers with this error code while the customer hasn't acted yet.
STILL_PROCESSING_ERROR = "500.001.1001"


class MpesaError(Exception):
    pass


def _cfg(key):
    return current_app.config.get(key) or ""


def normalize_phone(raw: str) -> str | None:
    """Accept 07XXXXXXXX, 01XXXXXXXX, +2547..., 2547... and return 2547XXXXXXXX."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "17":
        digits = "254" + digits
    if re.fullmatch(r"254[17]\d{8}", digits):
        return digits
    return None


def _access_token() -> str:
    key, secret = _cfg("MPESA_CONSUMER_KEY"), _cfg("MPESA_CONSUMER_SECRET")
    if not key or not secret or not _cfg("MPESA_PASSKEY"):
        raise MpesaError("M-Pesa is not configured on the server")
    resp = requests.get(
        f"{_cfg('MPESA_BASE_URL')}/oauth/v1/generate?grant_type=client_credentials",
        auth=(key, secret),
        timeout=20,
    )
    if resp.status_code != 200:
        logger.error("Daraja auth failed: %s %s", resp.status_code, resp.text[:200])
        raise MpesaError("Could not reach M-Pesa. Please try again shortly")
    return resp.json()["access_token"]


def _password(timestamp: str) -> str:
    raw = f"{_cfg('MPESA_SHORTCODE')}{_cfg('MPESA_PASSKEY')}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


def _apply_result(booking: GuideBooking, result_code, result_desc: str = "", receipt: str | None = None):
    try:
        code = int(result_code)
    except (TypeError, ValueError):
        return
    if code == 0:
        booking.status = "confirmed"
    elif code in CANCELLED_CODES:
        booking.status = "cancelled"
    else:
        booking.status = "failed"
    booking.payment_message = (RESULT_MESSAGES.get(code) or result_desc or "")[:255]
    if receipt:
        booking.mpesa_receipt = receipt[:50]


def _own_booking(booking_id):
    user_id = int(get_jwt_identity())
    booking = db.session.get(GuideBooking, booking_id) if booking_id else None
    if not booking or booking.user_id != user_id:
        return None
    return booking


@mpesa_router.route("/mpesa-payment", methods=["POST"])
@jwt_required()
def mpesa_payment():
    data = request.get_json() or {}
    booking = _own_booking(data.get("guide_booking_id"))
    if not booking:
        return jsonify({"status": "error", "message": "Booking not found"}), 404
    if booking.status == "confirmed":
        return jsonify({"status": "error", "message": "This booking is already paid"}), 409

    phone = normalize_phone(str(data.get("phone_number", "")))
    if not phone:
        return jsonify(
            {"status": "error", "message": "Enter a Safaricom number like 0712345678"}
        ), 400

    # Amount always comes from the booking, never from the client.
    amount = max(1, int(round(booking.amount or 0)))
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    shortcode = _cfg("MPESA_SHORTCODE")
    payload = {
        "BusinessShortCode": shortcode,
        "Password": _password(timestamp),
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": _cfg("MPESA_CALLBACK_URL"),
        "AccountReference": f"Kijiji{booking.id}",
        "TransactionDesc": "Kijiji guide booking",
    }

    try:
        token = _access_token()
        resp = requests.post(
            f"{_cfg('MPESA_BASE_URL')}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        body = resp.json() if resp.content else {}
    except MpesaError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 503
    except (requests.RequestException, ValueError):
        logger.exception("STK push request failed")
        return jsonify({"status": "error", "message": "Could not reach M-Pesa. Please try again"}), 502

    checkout_id = body.get("CheckoutRequestID")
    if resp.status_code != 200 or not checkout_id:
        logger.warning("STK push rejected: %s", body)
        message = body.get("errorMessage") or body.get("ResponseDescription") or "M-Pesa rejected the request"
        return jsonify({"status": "error", "message": message}), 502

    booking.mpesa_checkout_id = checkout_id
    booking.phone_number = phone
    booking.status = "awaiting_payment"
    booking.payment_message = "Check your phone and enter your M-Pesa PIN"
    db.session.commit()

    return jsonify(
        {
            "status": "success",
            "message": body.get("CustomerMessage") or "Payment request sent",
            "checkout_request_id": checkout_id,
            "booking": booking.to_dict(),
        }
    ), 200


@mpesa_router.route("/mpesa-callback", methods=["POST"])
def mpesa_callback():
    """Called by Safaricom. Always acknowledge so Daraja doesn't retry forever."""
    callback = (request.get_json(silent=True) or {}).get("Body", {}).get("stkCallback", {})
    checkout_id = callback.get("CheckoutRequestID")
    result_code = callback.get("ResultCode")

    booking = (
        GuideBooking.query.filter_by(mpesa_checkout_id=checkout_id).first() if checkout_id else None
    )
    # Only bookings still awaiting payment can change; replays are ignored.
    if booking and booking.status == "awaiting_payment":
        receipt = None
        for item in (callback.get("CallbackMetadata") or {}).get("Item", []):
            if item.get("Name") == "MpesaReceiptNumber":
                receipt = str(item.get("Value"))
        _apply_result(booking, result_code, callback.get("ResultDesc", ""), receipt)
        db.session.commit()

    logger.info("M-Pesa callback: checkout=%s result=%s matched=%s", checkout_id, result_code, bool(booking))
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200


def _query_daraja(booking: GuideBooking) -> None:
    """Ask Daraja for the STK result directly; leaves status unchanged while still pending."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    try:
        token = _access_token()
        resp = requests.post(
            f"{_cfg('MPESA_BASE_URL')}/mpesa/stkpushquery/v1/query",
            json={
                "BusinessShortCode": _cfg("MPESA_SHORTCODE"),
                "Password": _password(timestamp),
                "Timestamp": timestamp,
                "CheckoutRequestID": booking.mpesa_checkout_id,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        body = resp.json() if resp.content else {}
    except (MpesaError, requests.RequestException, ValueError) as exc:
        logger.info("STK query skipped: %s", exc)
        return

    if body.get("errorCode") == STILL_PROCESSING_ERROR or "ResultCode" not in body:
        return
    _apply_result(booking, body.get("ResultCode"), body.get("ResultDesc", ""))
    db.session.commit()


@mpesa_router.route("/guide-bookings/<int:booking_id>/payment-status", methods=["GET"])
@jwt_required()
def payment_status(booking_id):
    booking = _own_booking(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    if booking.status == "awaiting_payment" and booking.mpesa_checkout_id:
        _query_daraja(booking)
    return jsonify(
        {
            "id": booking.id,
            "status": booking.status,
            "message": booking.payment_message,
            "mpesa_receipt": booking.mpesa_receipt,
            "amount": booking.amount,
        }
    ), 200
