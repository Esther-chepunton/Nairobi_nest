import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from config import DEFAULT_SECRET, Config
from app.models import db
from app.auth.auth import auth, bcrypt, limiter
from app.routes.places import places_bp
from app.routes.recommendations import recommendations_bp
from app.routes.search import search_bp
from app.routes.favorites import favorites_bp
from app.routes.itineraries import itineraries_bp
from app.routes.guides import guides_bp
from app.routes.weather import weather_bp
from app.routes.mpesa_payment import mpesa_router
from app.routes.search_sessions import search_sessions_bp
from app.services.bootstrap import bootstrap_catalog
from app.services.migrate import ensure_postgres_extensions, migrate_sqlite_schema

migrate = Migrate()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    if app.config.get("IS_PRODUCTION") and app.config["SECRET_KEY"] == DEFAULT_SECRET:
        raise RuntimeError("SECRET_KEY must be set in production")

    cors_origins = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,https://nairobi-nest.vercel.app"
    ).split(",")
    origin_list = [origin.strip() for origin in cors_origins if origin.strip()]

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": origin_list,
                "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
        supports_credentials=True,
    )

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    limiter.init_app(app)
    jwt = JWTManager(app)

    # Every token problem is a 401 so the frontend can treat it as "signed out"
    # (the library default is 422 for malformed/bad-signature tokens).
    def _token_error(reason):
        return jsonify({"error": "Please sign in again", "reason": reason}), 401

    jwt.invalid_token_loader(lambda msg: _token_error(msg))
    jwt.expired_token_loader(lambda _header, _payload: _token_error("Token has expired"))
    jwt.unauthorized_loader(lambda msg: _token_error(msg))

    app.register_blueprint(auth, url_prefix="/api/auth")
    app.register_blueprint(places_bp, url_prefix="/api")
    app.register_blueprint(recommendations_bp, url_prefix="/api")
    app.register_blueprint(search_bp, url_prefix="/api")
    app.register_blueprint(search_sessions_bp, url_prefix="/api")
    app.register_blueprint(favorites_bp, url_prefix="/api")
    app.register_blueprint(itineraries_bp, url_prefix="/api")
    app.register_blueprint(guides_bp, url_prefix="/api")
    app.register_blueprint(weather_bp, url_prefix="/api")
    app.register_blueprint(mpesa_router, url_prefix="/api")

    @app.errorhandler(429)
    def rate_limited(_err):
        return jsonify({"error": "Too many attempts. Please wait a minute and try again."}), 429

    @app.route("/")
    def health_check():
        return jsonify({"status": "healthy", "message": "Kijiji API"})

    with app.app_context():
        db.create_all()
        migrate_sqlite_schema(app)
        ensure_postgres_extensions(app)
        if not app.config.get("TESTING"):
            bootstrap_catalog()

    return app
