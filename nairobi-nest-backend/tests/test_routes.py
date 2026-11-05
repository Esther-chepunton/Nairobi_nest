from datetime import date, timedelta

import pytest

from app.models import GuideBooking, db
from app.routes import mpesa_payment
from tests.conftest import register

TOMORROW = (date.today() + timedelta(days=1)).isoformat()


class FakeResponse:
    def __init__(self, payload, status=200):
        self._payload = payload
        self.status_code = status
        self.content = b"x"
        self.text = str(payload)

    def json(self):
        return self._payload


@pytest.fixture
def daraja(monkeypatch):
    """Mock Safaricom Daraja; records every STK request body."""
    calls = {"stk": [], "query": []}
    state = {"query_result": {"errorCode": "500.001.1001"}}

    def fake_get(url, **kwargs):
        assert "/oauth/v1/generate" in url
        return FakeResponse({"access_token": "tok"})

    def fake_post(url, json=None, **kwargs):
        if url.endswith("/stkpush/v1/processrequest"):
            calls["stk"].append(json)
            return FakeResponse(
                {"CheckoutRequestID": f"ws_CO_{len(calls['stk'])}", "CustomerMessage": "Success"}
            )
        if url.endswith("/stkpushquery/v1/query"):
            calls["query"].append(json)
            return FakeResponse(state["query_result"])
        raise AssertionError(url)

    monkeypatch.setattr(mpesa_payment.requests, "get", fake_get)
    monkeypatch.setattr(mpesa_payment.requests, "post", fake_post)
    return calls, state


def make_booking(client, headers, hours=2):
    res = client.post(
        "/api/guide-bookings",
        headers=headers,
        json={"guide_id": 1, "date": TOMORROW, "duration_hours": hours},
    )
    assert res.status_code == 201, res.get_json()
    return res.get_json()


# --- basics -----------------------------------------------------------------

def test_health(client):
    assert client.get("/").get_json()["status"] == "healthy"


def test_places_and_guides_seeded(client):
    assert len(client.get("/api/places").get_json()["places"]) > 5
    assert len(client.get("/api/guides").get_json()["guides"]) > 0


def test_unknown_route_404(client):
    assert client.get("/api/does-not-exist").status_code == 404


# --- auth -------------------------------------------------------------------

@pytest.mark.parametrize(
    "payload, message",
    [
        ({"full_name": "A", "email": "not-an-email", "password": "longenough"}, "valid email"),
        ({"full_name": "A", "email": "a@b.co", "password": "short"}, "at least 8"),
        ({"email": "a@b.co", "password": "longenough"}, "required"),
    ],
)
def test_signup_validation(client, payload, message):
    res = client.post("/api/auth/signup", json=payload)
    assert res.status_code == 400
    assert message in res.get_json()["error"]


def test_login_is_case_insensitive(client):
    register(client, email="Wanjiru@Example.com")
    res = client.post("/api/auth/login", json={"email": "wanjiru@example.com", "password": "safari-2026"})
    assert res.status_code == 200


def test_wrong_password_rejected(client):
    register(client)
    res = client.post("/api/auth/login", json={"email": "amina@example.com", "password": "nope-nope"})
    assert res.status_code == 401


def test_protected_routes_need_token(client):
    assert client.get("/api/favorites").status_code == 401
    assert client.get("/api/guide-bookings").status_code == 401


def test_bad_token_is_401_not_422(client):
    res = client.get("/api/favorites", headers={"Authorization": "Bearer not.a.jwt"})
    assert res.status_code == 401


# --- search -----------------------------------------------------------------

@pytest.mark.parametrize("query, category", [("museum", "museum"), ("hiking", "trail")])
def test_search_ranks_matching_places_first(client, query, category):
    # The autouse no_network fixture proves search is served from the DB.
    res = client.post("/api/search", json={"q": query})
    assert res.status_code == 200
    top = res.get_json()["places"][0]["place"]
    assert top["category"] == category
    assert "Matches your search" in res.get_json()["places"][0]["match_reasons"]


def test_recommendations_without_query(client):
    res = client.post("/api/recommendations", json={"mood": "chill"})
    assert res.status_code == 200
    assert res.get_json()["places"]


# --- guide bookings ---------------------------------------------------------

def test_booking_amount_comes_from_guide_rate(client, auth_headers):
    booking = make_booking(client, auth_headers, hours=4)
    guide = client.get("/api/guides/1").get_json()
    assert booking["amount"] == guide["price_per_hour"] * 4
    assert booking["status"] == "pending"


@pytest.mark.parametrize(
    "payload",
    [
        {"guide_id": 1, "date": "2020-01-01"},
        {"guide_id": 1, "date": "tomorrow"},
        {"guide_id": 1, "date": TOMORROW, "duration_hours": -3},
        {"guide_id": 1, "date": TOMORROW, "duration_hours": 50},
    ],
)
def test_booking_validation(client, auth_headers, payload):
    assert client.post("/api/guide-bookings", headers=auth_headers, json=payload).status_code == 400


# --- M-Pesa -----------------------------------------------------------------

@pytest.mark.parametrize(
    "raw, expected",
    [
        ("0712345678", "254712345678"),
        ("+254 712 345 678", "254712345678"),
        ("254112345678", "254112345678"),
        ("712345678", "254712345678"),
        ("0612345678", None),
        ("12345", None),
    ],
)
def test_normalize_phone(raw, expected):
    assert mpesa_payment.normalize_phone(raw) == expected


def test_stk_push_charges_booking_amount_not_client_amount(client, auth_headers, daraja):
    calls, _ = daraja
    booking = make_booking(client, auth_headers)
    res = client.post(
        "/api/mpesa-payment",
        headers=auth_headers,
        json={"guide_booking_id": booking["id"], "phone_number": "0708374149", "amount": 1},
    )
    assert res.status_code == 200, res.get_json()
    sent = calls["stk"][0]
    assert sent["Amount"] == int(booking["amount"])
    assert sent["PhoneNumber"] == "254708374149"
    assert db.session.get(GuideBooking, booking["id"]).status == "awaiting_payment"


def test_callback_confirms_booking_from_database(client, auth_headers, daraja):
    booking = make_booking(client, auth_headers)
    checkout = client.post(
        "/api/mpesa-payment",
        headers=auth_headers,
        json={"guide_booking_id": booking["id"], "phone_number": "0708374149"},
    ).get_json()["checkout_request_id"]

    callback = {
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": checkout,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {"Item": [{"Name": "MpesaReceiptNumber", "Value": "SGR7XYZ123"}]},
            }
        }
    }
    assert client.post("/api/mpesa-callback", json=callback).status_code == 200

    status = client.get(f"/api/guide-bookings/{booking['id']}/payment-status", headers=auth_headers).get_json()
    assert status["status"] == "confirmed"
    assert status["mpesa_receipt"] == "SGR7XYZ123"

    # A replayed failure callback must not undo a confirmed payment.
    callback["Body"]["stkCallback"]["ResultCode"] = 1032
    client.post("/api/mpesa-callback", json=callback)
    assert db.session.get(GuideBooking, booking["id"]).status == "confirmed"


def test_status_endpoint_queries_daraja_when_callback_never_arrives(client, auth_headers, daraja):
    calls, state = daraja
    booking = make_booking(client, auth_headers)
    client.post(
        "/api/mpesa-payment",
        headers=auth_headers,
        json={"guide_booking_id": booking["id"], "phone_number": "0708374149"},
    )
    url = f"/api/guide-bookings/{booking['id']}/payment-status"

    # Still waiting for the PIN.
    assert client.get(url, headers=auth_headers).get_json()["status"] == "awaiting_payment"

    # User cancels on the phone.
    state["query_result"] = {"ResultCode": "1032", "ResultDesc": "Request cancelled by user"}
    result = client.get(url, headers=auth_headers).get_json()
    assert result["status"] == "cancelled"
    assert len(calls["query"]) == 2


def test_cannot_pay_or_view_someone_elses_booking(client, auth_headers, daraja):
    booking = make_booking(client, auth_headers)
    other = register(client, email="otieno@example.com")
    res = client.post(
        "/api/mpesa-payment",
        headers=other,
        json={"guide_booking_id": booking["id"], "phone_number": "0708374149"},
    )
    assert res.status_code == 404
    assert client.get(f"/api/guide-bookings/{booking['id']}/payment-status", headers=other).status_code == 404


def test_unknown_callback_is_acknowledged(client):
    res = client.post("/api/mpesa-callback", json={"Body": {"stkCallback": {"CheckoutRequestID": "nope"}}})
    assert res.status_code == 200
