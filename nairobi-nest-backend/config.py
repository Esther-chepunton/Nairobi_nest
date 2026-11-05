import os
from datetime import timedelta

from dotenv import load_dotenv

# Load .env before any setting is read. Every module imports config first,
# so this guarantees .env values apply under `python run.py`, gunicorn and the flask CLI.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

DEFAULT_SECRET = "dev-secret-key-change-in-production-min-32-chars"


def _normalize_database_url(url):
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or DEFAULT_SECRET
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.environ.get("JWT_EXPIRES_DAYS", "7")))
    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.environ.get("DATABASE_URL") or "sqlite:///users.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MPESA_CALLBACK_URL = os.environ.get(
        "MPESA_CALLBACK_URL", "http://localhost:10000/api/mpesa-callback"
    )
    MPESA_CONSUMER_KEY = os.environ.get("MPESA_CONSUMER_KEY", "")
    MPESA_CONSUMER_SECRET = os.environ.get("MPESA_CONSUMER_SECRET", "")
    MPESA_SHORTCODE = os.environ.get("MPESA_SHORTCODE", "174379")
    MPESA_PASSKEY = os.environ.get("MPESA_PASSKEY", "")
    # "sandbox" (default) or "production"
    MPESA_BASE_URL = (
        "https://api.safaricom.co.ke"
        if os.environ.get("MPESA_ENV", "sandbox").lower() == "production"
        else "https://sandbox.safaricom.co.ke"
    )
    OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
    # Live (per-request) OSM/Wikipedia discovery. Off by default: search is served
    # from the database, which the scheduled ingestion job keeps fresh.
    LIVE_DISCOVERY_ENABLED = os.environ.get("LIVE_DISCOVERY_ENABLED", "0").lower() in ("1", "true", "yes")
    LIVE_DISCOVERY_TIMEOUT_SECONDS = float(os.environ.get("LIVE_DISCOVERY_TIMEOUT_SECONDS", "8"))

    WORKER_SECRET = os.environ.get("WORKER_SECRET", "dev-worker-secret")
    SOURCES_CONFIG_PATH = os.environ.get(
        "SOURCES_CONFIG_PATH",
        os.path.join(os.path.dirname(__file__), "config", "sources.yaml"),
    )
    TAXONOMY_CONFIG_PATH = os.environ.get(
        "TAXONOMY_CONFIG_PATH",
        os.path.join(os.path.dirname(__file__), "config", "taxonomy.yaml"),
    )
    YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
    SEARCH_CACHE_TTL_SECONDS = int(os.environ.get("SEARCH_CACHE_TTL_SECONDS", "900"))
    PLACE_CACHE_MAX_AGE_DAYS = int(os.environ.get("PLACE_CACHE_MAX_AGE_DAYS", "7"))
    SEARCH_RESUME_HOURS = int(os.environ.get("SEARCH_RESUME_HOURS", "48"))
    ANON_COOKIE_NAME = os.environ.get("ANON_COOKIE_NAME", "kijiji_aid")
    ANON_COOKIE_MAX_AGE = int(os.environ.get("ANON_COOKIE_MAX_AGE", str(90 * 24 * 3600)))
    # Local HTTP: Lax + non-Secure. Production HTTPS (Render/Vercel): None + Secure.
    # Override with COOKIE_SAMESITE / COOKIE_SECURE if needed.
    _flask_env = (os.environ.get("FLASK_ENV") or os.environ.get("ENV") or "development").lower()
    _is_prod = _flask_env == "production"
    COOKIE_SAMESITE = os.environ.get(
        "COOKIE_SAMESITE", "None" if _is_prod else "Lax"
    )
    if "COOKIE_SECURE" in os.environ:
        COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "0").lower() in ("1", "true", "yes")
    else:
        COOKIE_SECURE = _is_prod
    INGESTION_MAX_ATTEMPTS = int(os.environ.get("INGESTION_MAX_ATTEMPTS", "5"))
    IS_PRODUCTION = _is_prod
    IS_POSTGRES = SQLALCHEMY_DATABASE_URI.startswith("postgresql")
