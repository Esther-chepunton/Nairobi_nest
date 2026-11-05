import os
from typing import Any, Dict, List, Optional

from ingestion.base import NormalizedPlaceDraft, RawRecord, SourceAdapter
from ingestion.http_client import HttpClient
from ingestion.config_loader import load_taxonomy_config
from pipeline.normalizer import infer_category, infer_moods_companions, is_discoverable, slugify_name


class OpenStreetMapAdapter(SourceAdapter):
    source_name = "openstreetmap"
    reliability_weight = 0.90

    OVERPASS_URL = os.environ.get("OVERPASS_URL", "https://overpass-api.de/api/interpreter")

    def __init__(self, config: Dict[str, Any], global_config: Dict[str, Any]):
        self.config = config
        self.bbox = config.get("bbox", {})
        ua = global_config.get("default_user_agent", "KijijiDiscoveryBot/1.0")
        rpm = config.get("requests_per_minute", 30)
        self.client = HttpClient(user_agent=ua, requests_per_minute=rpm)
        self.taxonomy = load_taxonomy_config()

    def _build_query(self) -> str:
        s = self.bbox.get("south", -4.7)
        w = self.bbox.get("west", 33.9)
        n = self.bbox.get("north", 4.6)
        e = self.bbox.get("east", 41.9)
        return f"""
        [out:json][timeout:90];
        (
          node["tourism"]({s},{w},{n},{e});
          way["tourism"]({s},{w},{n},{e});
          node["natural"="waterfall"]({s},{w},{n},{e});
          node["amenity"~"cafe|restaurant|museum"]({s},{w},{n},{e});
          node["leisure"="park"]({s},{w},{n},{e});
          way["boundary"="national_park"]({s},{w},{n},{e});
        );
        out center tags;
        """

    def _build_around_query(self, lat: float, lon: float, radius_m: int = 15000) -> str:
        """Scoped Overpass query for live per-request discovery (cron still uses full bbox)."""
        return f"""
        [out:json][timeout:25];
        (
          node["tourism"](around:{radius_m},{lat},{lon});
          way["tourism"](around:{radius_m},{lat},{lon});
          node["natural"="waterfall"](around:{radius_m},{lat},{lon});
          node["amenity"~"cafe|restaurant|museum"](around:{radius_m},{lat},{lon});
          node["leisure"="park"](around:{radius_m},{lat},{lon});
        );
        out center tags 60;
        """

    def fetch(self, cursor: Optional[Dict[str, Any]] = None):
        if cursor and cursor.get("done"):
            return [], None
        # Live path: around-point query when lat/lon provided in cursor.
        if cursor and cursor.get("lat") is not None and cursor.get("lon") is not None:
            query = self._build_around_query(
                float(cursor["lat"]),
                float(cursor["lon"]),
                int(cursor.get("radius_m") or 15000),
            )
            resp = self.client.post(self.OVERPASS_URL, data={"data": query}, timeout=30)
            data = resp.json()
            return self._records_from_elements(data.get("elements", [])), None

        query = self._build_query()
        resp = self.client.post(self.OVERPASS_URL, data={"data": query}, timeout=120)
        data = resp.json()
        return self._records_from_elements(data.get("elements", [])), {"done": True}

    def _records_from_elements(self, elements: List[Dict[str, Any]]) -> List[RawRecord]:
        records = []
        for element in elements:
            tags = element.get("tags") or {}
            name = tags.get("name") or tags.get("name:en")
            if not name:
                continue
            osm_type = element.get("type", "node")
            osm_id = element.get("id")
            source_id = f"{osm_type}/{osm_id}"
            lat = element.get("lat")
            lon = element.get("lon")
            if lat is None and "center" in element:
                lat = element["center"].get("lat")
                lon = element["center"].get("lon")
            records.append(
                RawRecord(
                    source_name=self.source_name,
                    source_id=source_id,
                    source_url=f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
                    payload={"tags": tags, "lat": lat, "lon": lon, "element": element},
                )
            )
        return records

    def normalize(self, raw: RawRecord) -> Optional[NormalizedPlaceDraft]:
        tags = raw.payload.get("tags") or {}
        name = tags.get("name") or tags.get("name:en")
        if not name or not is_discoverable(name, tags.get("description", ""), tags):
            return None
        lat = raw.payload.get("lat")
        lon = raw.payload.get("lon")
        category = infer_category(tags, name, tags.get("description", ""), self.taxonomy)
        desc = tags.get("description") or tags.get("tourism") or ""
        location = tags.get("addr:city") or tags.get("is_in:city") or tags.get("addr:suburb") or "Kenya"
        tag_list = [t for t in [category] + list(tags.values())[:5] if isinstance(t, str)][:8]
        moods, companions = infer_moods_companions(name, desc, tag_list, self.taxonomy)
        website = tags.get("website") or tags.get("contact:website") or ""
        images = []
        if tags.get("image"):
            images.append(tags["image"])
        if tags.get("wikimedia_commons"):
            images.append(f"https://commons.wikimedia.org/wiki/Special:FilePath/{tags['wikimedia_commons']}")
        return NormalizedPlaceDraft(
            name=name.strip(),
            category=category,
            source_name=self.source_name,
            source_id=raw.source_id,
            location_name=location,
            latitude=float(lat) if lat is not None else None,
            longitude=float(lon) if lon is not None else None,
            description=desc[:2000] if desc else f"{name} — listed on OpenStreetMap.",
            tags=tag_list,
            external_website=website,
            source_url=raw.source_url,
            raw_confidence=self.reliability_weight,
            images=images,
            moods=moods,
            companions=companions,
            fetched_at=raw.fetched_at,
        )
