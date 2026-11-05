import re
from typing import Any, Dict, List, Tuple

from slugify import slugify


KENYA_BOUNDS = {"lat_min": -4.7, "lat_max": 4.6, "lon_min": 33.9, "lon_max": 41.9}


def slugify_name(name: str, location: str = "") -> str:
    base = slugify(name, max_length=180)
    if location:
        loc = slugify(location.split(",")[0], max_length=40)
        return f"{base}-{loc}" if loc else base
    return base or "place"


def is_valid_coords(lat: float | None, lon: float | None) -> bool:
    if lat is None or lon is None:
        return False
    return (
        KENYA_BOUNDS["lat_min"] <= lat <= KENYA_BOUNDS["lat_max"]
        and KENYA_BOUNDS["lon_min"] <= lon <= KENYA_BOUNDS["lon_max"]
    )


def infer_category(
    tags: Dict[str, Any],
    name: str,
    description: str,
    taxonomy: Dict,
) -> str:
    text = f"{name} {description}".lower()
    tag_values = " ".join(str(v).lower() for v in tags.values())

    for cat, cfg in (taxonomy.get("categories") or {}).items():
        osm_tags = cfg.get("osm_tags") or []
        for osm_tag in osm_tags:
            key, _, val = osm_tag.partition("=")
            if val and tags.get(key) == val:
                return cat
            if val and tags.get(key) == val.replace("*", tags.get(key, "")):
                return cat
        for kw in cfg.get("keywords") or []:
            if kw in text or kw in tag_values:
                return cat

    tourism = tags.get("tourism")
    if tourism == "museum":
        return "museum"
    if tourism == "viewpoint":
        return "viewpoint"
    amenity = tags.get("amenity")
    if amenity in ("cafe", "restaurant", "museum"):
        return amenity if amenity != "museum" else "museum"
    if tags.get("natural") == "waterfall" or tags.get("waterway") == "waterfall":
        return "waterfall"
    if tags.get("leisure") == "park":
        return "park"
    return "cultural"


def infer_moods_companions(
    name: str,
    description: str,
    tags: List[str],
    taxonomy: Dict,
) -> Tuple[List[str], List[str]]:
    text = f"{name} {description} {' '.join(tags)}".lower()
    moods = []
    companions = []
    for mood, keywords in (taxonomy.get("mood_keywords") or {}).items():
        if any(kw in text for kw in keywords):
            moods.append(mood)
    for comp, keywords in (taxonomy.get("companion_keywords") or {}).items():
        if any(kw in text for kw in keywords):
            companions.append(comp)
    if not moods:
        moods = ["peaceful"]
    if not companions:
        companions = ["solo", "friends"]
    return moods[:3], companions[:3]


def normalize_draft(draft) -> dict:
    """Convert NormalizedPlaceDraft to dict with validated coords."""
    lat = draft.latitude
    lon = draft.longitude
    if lat is not None and lon is not None and not is_valid_coords(lat, lon):
        lat, lon = None, None
    slug = slugify_name(draft.name, draft.location_name)
    return {
        "name": draft.name.strip(),
        "slug": slug,
        "category": draft.category,
        "description": draft.description,
        "location_name": draft.location_name,
        "latitude": lat,
        "longitude": lon,
        "price_min": draft.price_min,
        "price_max": draft.price_max,
        "opening_hours": draft.opening_hours,
        "tags": list(dict.fromkeys(draft.tags)),
        "moods": draft.moods,
        "companions": draft.companions,
        "images": draft.images[:10],
        "action_url": draft.external_website or None,
        "source_name": draft.source_name,
        "source_id": draft.source_id,
        "source_url": draft.source_url,
        "raw_confidence": draft.raw_confidence,
        "fetched_at": draft.fetched_at,
    }


# --- What counts as a discoverable experience -------------------------------
# Wikipedia geosearch and broad OSM tourism=* queries also return countries, cities,
# airports, offices and accommodation. Kijiji is about things to do, so drop those.
EXCLUDED_OSM_TAGS = {
    "tourism": {"hotel", "guest_house", "hostel", "motel", "apartment", "chalet", "information", "camp_pitch"},
    "amenity": {"hospital", "school", "university", "college", "police", "bank"},
    "aeroway": {"aerodrome", "airport", "helipad"},
}
_EXCLUDED_NAME = re.compile(
    r"\b(airport|airstrip|county|constituency|sub-county|embassy|high commission|united nations|"
    r"ministry|hospital|school|university|college|police|railway station|bus station|hotel|lodge|"
    r"guest ?house|hostel|apartments?)\b",
    re.IGNORECASE,
)
# Names that are just a country/city, e.g. a Wikipedia article titled "Kenya" or "Nairobi".
_BARE_PLACE_NAMES = {"kenya", "nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "thika", "naivasha"}
_ADMIN_AREA_SENTENCE = re.compile(
    r"\b(?:is|was) (?:a|an|the) (?:[\w'-]+ ){0,4}(?:country|city|town|county|capital|constituency|"
    r"municipality|airport|village|suburb|neighbou?rhood|district|province)\b",
    re.IGNORECASE,
)


def is_discoverable(name: str, description: str = "", osm_tags: Dict[str, Any] | None = None) -> bool:
    if not name or _EXCLUDED_NAME.search(name) or name.strip().lower() in _BARE_PLACE_NAMES:
        return False
    for key, values in EXCLUDED_OSM_TAGS.items():
        if (osm_tags or {}).get(key) in values:
            return False
    first_sentence = re.split(r"(?<=[.!?])\s", (description or "").strip(), maxsplit=1)[0]
    return not _ADMIN_AREA_SENTENCE.search(first_sentence)
