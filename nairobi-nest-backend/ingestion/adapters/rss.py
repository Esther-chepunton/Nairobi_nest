import re
from typing import Any, Dict, List, Optional

import feedparser

from ingestion.base import NormalizedPlaceDraft, RawRecord, SourceAdapter
from ingestion.http_client import HttpClient
from ingestion.config_loader import load_taxonomy_config
from pipeline.normalizer import infer_category, infer_moods_companions, slugify_name


class RSSAdapter(SourceAdapter):
    source_name = "rss"
    reliability_weight = 0.80

    def __init__(self, config: Dict[str, Any], global_config: Dict[str, Any]):
        self.feeds = config.get("feeds", [])
        ua = global_config.get("default_user_agent", "KijijiDiscoveryBot/1.0")
        rpm = config.get("requests_per_minute", 20)
        self.client = HttpClient(user_agent=ua, requests_per_minute=rpm)
        self.taxonomy = load_taxonomy_config()

    def fetch(self, cursor: Optional[Dict[str, Any]] = None):
        cursor = cursor or {"feed_index": 0}
        feed_index = cursor.get("feed_index", 0)
        if feed_index >= len(self.feeds):
            return [], None

        feed_cfg = self.feeds[feed_index]
        url = feed_cfg["url"]
        resp = self.client.get(url, timeout=30)
        parsed = feedparser.parse(resp.text)
        records = []
        for entry in parsed.entries[:20]:
            entry_id = entry.get("id") or entry.get("link") or entry.get("title")
            if not entry_id:
                continue
            records.append(
                RawRecord(
                    source_name=self.source_name,
                    source_id=f"{feed_cfg.get('name', 'rss')}:{entry_id}"[:200],
                    source_url=entry.get("link", url),
                    payload={
                        "title": entry.get("title", ""),
                        "summary": entry.get("summary", ""),
                        "link": entry.get("link", ""),
                        "feed": feed_cfg.get("name", "rss"),
                    },
                )
            )
        next_index = feed_index + 1
        next_cursor = {"feed_index": next_index} if next_index < len(self.feeds) else None
        return records, next_cursor

    def normalize(self, raw: RawRecord) -> Optional[NormalizedPlaceDraft]:
        title = raw.payload.get("title", "").strip()
        if not title or len(title) < 5:
            return None
        summary = re.sub(r"<[^>]+>", "", raw.payload.get("summary", ""))[:2000]
        category = infer_category({}, title, summary, self.taxonomy)
        if category == "cultural" and "event" not in title.lower():
            category = "event"
        tags = ["event", raw.payload.get("feed", "rss")]
        moods, companions = infer_moods_companions(title, summary, tags, self.taxonomy)
        return NormalizedPlaceDraft(
            name=title[:200],
            category=category,
            source_name=self.source_name,
            source_id=raw.source_id,
            location_name="Nairobi, Kenya",
            latitude=-1.286389,
            longitude=36.817223,
            description=summary or title,
            tags=tags,
            source_url=raw.source_url,
            raw_confidence=self.reliability_weight * 0.8,
            moods=moods,
            companions=companions,
            fetched_at=raw.fetched_at,
        )
