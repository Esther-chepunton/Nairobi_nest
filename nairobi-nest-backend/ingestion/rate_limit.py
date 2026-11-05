from datetime import datetime, timedelta
from urllib.parse import urlparse

from app.models import RateLimitState, db


class RateLimiter:
    def __init__(self, domain: str, requests_per_minute: int = 30):
        self.domain = domain
        self.rpm = max(requests_per_minute, 1)
        self.capacity = float(self.rpm)
        self.refill_rate = self.rpm / 60.0

    def _get_state(self) -> RateLimitState:
        state = RateLimitState.query.filter_by(domain=self.domain).first()
        if not state:
            state = RateLimitState(domain=self.domain, tokens=self.capacity)
            db.session.add(state)
            db.session.commit()
        return state

    def acquire(self) -> bool:
        state = self._get_state()
        now = datetime.utcnow()
        if state.last_refill:
            elapsed = (now - state.last_refill).total_seconds()
            state.tokens = min(self.capacity, state.tokens + elapsed * self.refill_rate)
        state.last_refill = now
        if state.tokens >= 1:
            state.tokens -= 1
            db.session.commit()
            return True
        db.session.commit()
        return False

    def wait_until_allowed(self, max_wait_seconds: int = 60) -> bool:
        import time

        deadline = datetime.utcnow() + timedelta(seconds=max_wait_seconds)
        while datetime.utcnow() < deadline:
            if self.acquire():
                return True
            time.sleep(1)
        return False


def limiter_for_url(url: str, requests_per_minute: int = 30) -> RateLimiter:
    domain = urlparse(url).netloc.lower() or "default"
    return RateLimiter(domain, requests_per_minute)
