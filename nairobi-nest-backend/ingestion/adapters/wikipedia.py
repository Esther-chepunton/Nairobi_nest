from typing import Any, Dict, List, Optional

from ingestion.base import NormalizedPlaceDraft, RawRecord, SourceAdapter
from ingestion.http_client import HttpClient
from ingestion.config_loader import load_taxonomy_config
from pipeline.normalizer import infer_category, infer_moods_companions, is_discoverable


class WikipediaAdapter(SourceAdapter):
    source_name = "wikipedia"
    reliability_weight = 0.85

    API_URL = "https://en.wikipedia.org/w/api.php"

    def __init__(self, config: Dict[str, Any], global_config: Dict[str, Any]):
        self.config = config
        self.search_terms = config.get("search_terms", ["Nairobi tourism"])
        ua = global_config.get("default_user_agent", "KijijiDiscoveryBot/1.0")
        rpm = config.get("requests_per_minute", 60)
        self.client = HttpClient(user_agent=ua, requests_per_minute=rpm)
        self.taxonomy = load_taxonomy_config()

    def fetch(self, cursor: Optional[Dict[str, Any]] = None):
        cursor = cursor or {"term_index": 0}
        term_index = cursor.get("term_index", 0)
        if term_index >= len(self.search_terms):
            return [], None

        term = self.search_terms[term_index]
        params = {
            "action": "query",
            "format": "json",
            "generator": "geosearch",
            "ggscoord": "-1.286389|36.817223",
            "ggsradius": 100000,
            "ggslimit": 20,
            "prop": "coordinates|pageimages|extracts|info",
            "inprop": "url",
            "piprop": "thumbnail",
            "pithumbsize": 800,
            "exintro": True,
            "explaintext": True,
            "exlimit": 1,
            "titles": term,
        }
        resp = self.client.get(self.API_URL, params={
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": term,
            "srlimit": 15,
            "srnamespace": 0,
        })
        search_data = resp.json()
        titles = [item["title"] for item in search_data.get("query", {}).get("search", [])]

        records = []
        for title in titles:
            detail_resp = self.client.get(self.API_URL, params={
                "action": "query",
                "format": "json",
                "titles": title,
                "prop": "coordinates|pageimages|extracts|info",
                "inprop": "url",
                "piprop": "thumbnail",
                "pithumbsize": 800,
                "exintro": True,
                "explaintext": True,
            })
            pages = detail_resp.json().get("query", {}).get("pages", {})
            for page_id, page in pages.items():
                if page_id == "-1":
                    continue
                coords = (page.get("coordinates") or [{}])[0]
                lat = coords.get("lat")
                lon = coords.get("lon")
                if lat is None or lon is None:
                    continue
                records.append(
                    RawRecord(
                        source_name=self.source_name,
                        source_id=str(page_id),
                        source_url=page.get("fullurl", f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"),
                        payload=page,
                    )
                )

        next_cursor = {"term_index": term_index + 1}
        if next_cursor["term_index"] >= len(self.search_terms):
            next_cursor = None
        return records, next_cursor

    def normalize(self, raw: RawRecord) -> Optional[NormalizedPlaceDraft]:
        page = raw.payload
        title = page.get("title")
        if not title or not is_discoverable(title, page.get("extract") or ""):
            return None
        coords = (page.get("coordinates") or [{}])[0]
        lat = coords.get("lat")
        lon = coords.get("lon")
        extract = page.get("extract") or ""
        thumb = (page.get("thumbnail") or {}).get("source")
        images = [thumb] if thumb else []
        tags = ["wikipedia", "culture"]
        category = infer_category({}, title, extract, self.taxonomy)
        moods, companions = infer_moods_companions(title, extract, tags, self.taxonomy)
        return NormalizedPlaceDraft(
            name=title,
            category=category,
            source_name=self.source_name,
            source_id=raw.source_id,
            location_name="Kenya",
            latitude=float(lat) if lat is not None else None,
            longitude=float(lon) if lon is not None else None,
            description=extract[:2000],
            tags=tags,
            source_url=raw.source_url,
            raw_confidence=self.reliability_weight,
            images=images,
            moods=moods,
            companions=companions,
            fetched_at=raw.fetched_at,
        )
