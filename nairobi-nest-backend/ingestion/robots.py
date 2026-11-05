from datetime import datetime, timedelta
from urllib.parse import urlparse

import requests

from app.models import RobotsCache, db


def _domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower()


def is_url_allowed(url: str, user_agent: str = "KijijiDiscoveryBot/1.0") -> bool:
    domain = _domain(url)
    if not domain:
        return False

    cached = RobotsCache.query.filter_by(domain=domain).first()
    if cached and cached.fetched_at and cached.fetched_at > datetime.utcnow() - timedelta(hours=24):
        return cached.allowed

    allowed = True
    try:
        robots_url = f"{urlparse(url).scheme}://{domain}/robots.txt"
        resp = requests.get(robots_url, timeout=10, headers={"User-Agent": user_agent})
        if resp.status_code == 200:
            text = resp.text.lower()
            if "disallow: /" in text and user_agent.lower() in text:
                allowed = False
    except requests.RequestException:
        allowed = True

    entry = cached or RobotsCache(domain=domain)
    entry.allowed = allowed
    entry.fetched_at = datetime.utcnow()
    db.session.add(entry)
    db.session.commit()
    return allowed
