import time
from typing import Any, Dict, Optional

import requests

from ingestion.rate_limit import limiter_for_url


class HttpClient:
    def __init__(self, user_agent: str = "KijijiDiscoveryBot/1.0", requests_per_minute: int = 30):
        self.user_agent = user_agent
        self.rpm = requests_per_minute
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": user_agent,
                "Accept": "application/json, text/xml, */*;q=0.8",
                "Referer": "https://github.com/Esther-chepunton/Nairobi_nest",
            }
        )

    @staticmethod
    def _is_retryable(exc: requests.RequestException) -> bool:
        """Retry network errors, 429 and 5xx only. Retrying other 4xx (e.g. Overpass 406)
        never succeeds and gets the client banned faster."""
        resp = getattr(exc, "response", None)
        if resp is None:
            return True
        return resp.status_code == 429 or resp.status_code >= 500

    def get(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        timeout: int = 30,
        max_retries: int = 3,
    ) -> requests.Response:
        limiter = limiter_for_url(url, self.rpm)
        last_error = None
        for attempt in range(max_retries):
            if not limiter.wait_until_allowed():
                raise requests.RequestException(f"Rate limit exceeded for {url}")
            try:
                resp = self.session.get(url, params=params, timeout=timeout)
                if resp.status_code == 429:
                    time.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                return resp
            except requests.RequestException as exc:
                last_error = exc
                if not self._is_retryable(exc):
                    break
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
        raise last_error

    def post(
        self,
        url: str,
        data: Optional[Dict[str, Any]] = None,
        timeout: int = 60,
        max_retries: int = 3,
    ) -> requests.Response:
        limiter = limiter_for_url(url, self.rpm)
        last_error = None
        for attempt in range(max_retries):
            if not limiter.wait_until_allowed():
                raise requests.RequestException(f"Rate limit exceeded for {url}")
            try:
                resp = self.session.post(url, data=data, timeout=timeout)
                if resp.status_code == 429:
                    time.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                return resp
            except requests.RequestException as exc:
                last_error = exc
                if not self._is_retryable(exc):
                    break
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
        raise last_error
