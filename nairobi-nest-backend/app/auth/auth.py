import re

from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, Favorite, Place

auth = Blueprint('auth', __name__)
bcrypt = Bcrypt()
# In-memory limits are per process; good enough to slow down password guessing on a demo.
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://", default_limits=[])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8

@auth.route('/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    data = request.get_json() or {}
    full_name = (data.get('full_name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not full_name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Enter a valid email address"}), 400
    if len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({"error": f"Password must be at least {MIN_PASSWORD_LENGTH} characters"}), 400

    existing_user = User.query.filter(db.func.lower(User.email) == email).first()
    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = User(full_name=full_name, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

@auth.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Case-insensitive so accounts created before emails were normalised still work.
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify(
        {
            "message": "Login successful",
            "token": access_token,
            "user": {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "preferences": user.preferences or {},
            },
        }
    ), 200

@auth.route('/preferences', methods=['PATCH'])
@jwt_required()
def update_preferences():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    prefs = user.preferences or {}
    for key in ('interests', 'budget_range', 'travel_style', 'default_mood'):
        if key in data:
            prefs[key] = data[key]
    user.preferences = prefs
    db.session.commit()
    return jsonify({"preferences": user.preferences}), 200

@auth.route('/visited', methods=['POST'])
@jwt_required()
def mark_visited():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    place_key = data.get('place_key')
    place_id = data.get('place_id')

    from app.services.place_identity import place_key_from_place, resolve_place_ref

    key = place_key
    if not key and place_id is not None:
        place = resolve_place_ref(place_id)
        if place:
            key = place_key_from_place(place)
        else:
            key = str(place_id)
    if not key:
        return jsonify({"error": "place_key or place_id is required"}), 400

    visited = list(user.visited_place_ids or [])
    # Store stable keys; migrate stray numeric ids in-place when re-visited.
    if key not in visited:
        visited.append(key)
        user.visited_place_ids = visited
        db.session.commit()
    return jsonify({"visited_place_ids": user.visited_place_ids}), 200

@auth.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    fav_count = Favorite.query.filter_by(user_id=user_id).count()
    return jsonify({
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "preferences": user.preferences or {},
        "visited_place_ids": user.visited_place_ids or [],
        "favorites_count": fav_count,
    }), 200

@auth.route('/because-you-liked', methods=['GET'])
@jwt_required()
def because_you_liked():
    user_id = int(get_jwt_identity())
    favorites = Favorite.query.filter_by(user_id=user_id).limit(3).all()
    if not favorites:
        trending = Place.query.filter_by(is_trending=True).limit(4).all()
        return jsonify({"places": [p.to_dict() for p in trending], "based_on": None}), 200

    fav = favorites[0]
    from app.services.place_identity import favorite_place_view

    liked_view = favorite_place_view(fav)
    category = liked_view.get("category") or fav.category
    liked_id = fav.place_id or liked_view.get("legacy_place_id") or liked_view.get("id")

    query = Place.query.filter(Place.is_published.is_(True))
    if category:
        query = query.filter(Place.category == category)
    if liked_id:
        query = query.filter(Place.id != liked_id)
    similar = query.limit(4).all()
    return jsonify({
        "places": [p.to_dict() for p in similar],
        "based_on": liked_view,
    }), 200
