import pytest
import requests

from app import create_app
from app.models import db
from app.services.bootstrap import bootstrap_catalog


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Fail loudly if any request handler tries to reach the internet."""

    def blocked(*args, **kwargs):
        raise AssertionError(f"Unexpected network call: {args[1:3]}")

    monkeypatch.setattr(requests.Session, "request", blocked)


@pytest.fixture
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "RATELIMIT_ENABLED": False,
            "LIVE_DISCOVERY_ENABLED": False,
            "MPESA_CONSUMER_KEY": "test-key",
            "MPESA_CONSUMER_SECRET": "test-secret",
            "MPESA_PASSKEY": "test-passkey",
            "MPESA_SHORTCODE": "174379",
        }
    )
    with app.app_context():
        bootstrap_catalog()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, email="amina@example.com", password="safari-2026", name="Amina"):
    client.post("/api/auth/signup", json={"full_name": name, "email": email, "password": password})
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.get_json()
    return {"Authorization": f"Bearer {res.get_json()['token']}"}


@pytest.fixture
def auth_headers(client):
    return register(client)
