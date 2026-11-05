"""Anonymous visitor identity via HTTP-only cookie."""

import secrets

from flask import current_app, request


def get_anon_id_from_request():
    name = current_app.config.get("ANON_COOKIE_NAME", "kijiji_aid")
    return request.cookies.get(name)


def ensure_anon_id():
    """Return existing cookie anon id or mint a new one (caller must set cookie)."""
    existing = get_anon_id_from_request()
    if existing and len(existing) >= 16:
        return existing, False
    return secrets.token_urlsafe(24), True


def apply_anon_cookie(response, anon_id):
    name = current_app.config.get("ANON_COOKIE_NAME", "kijiji_aid")
    max_age = current_app.config.get("ANON_COOKIE_MAX_AGE", 90 * 24 * 3600)
    samesite = current_app.config.get("COOKIE_SAMESITE", "Lax")
    # Prefer explicit config. Never force Secure=True for SameSite=None on plain HTTP —
    # that silently drops the cookie in local browsers.
    if "COOKIE_SECURE" in current_app.config:
        secure = bool(current_app.config.get("COOKIE_SECURE"))
    else:
        secure = request.is_secure or samesite.lower() == "none"

    # If SameSite=None but we're on HTTP (local), fall back to Lax so the cookie can set.
    if samesite.lower() == "none" and not secure and not request.is_secure:
        samesite = "Lax"
        secure = False

    response.set_cookie(
        name,
        anon_id,
        max_age=max_age,
        httponly=True,
        samesite=samesite,
        secure=secure,
        path="/",
    )
    return response
