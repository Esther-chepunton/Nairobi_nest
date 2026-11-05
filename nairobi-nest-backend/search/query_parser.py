import re
from typing import Any, Dict, List, Optional

from ingestion.config_loader import load_taxonomy_config


def parse_query(q: str, intent: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    intent = intent or {}
    taxonomy = load_taxonomy_config()
    text = (q or "").strip().lower()
    parsed = {
        "q": q or "",
        "category": intent.get("category") or "",
        "mood": intent.get("mood") or "",
        "budget_max": intent.get("budget_max"),
        "time_available_minutes": intent.get("time_available_minutes"),
        "companions": intent.get("companions") or "",
        "latitude": intent.get("latitude"),
        "longitude": intent.get("longitude"),
        "radius_km": 50,
        "keywords": [],
    }

    if "near nairobi" in text or "near nairobi" in text or "nairobi" in text:
        geo = (taxonomy.get("intent_geo") or {}).get("nairobi", {})
        parsed["latitude"] = parsed["latitude"] or geo.get("latitude")
        parsed["longitude"] = parsed["longitude"] or geo.get("longitude")
        parsed["radius_km"] = geo.get("radius_km", 50)

    for cat, cfg in (taxonomy.get("categories") or {}).items():
        for kw in cfg.get("keywords") or []:
            if kw in text:
                parsed["category"] = parsed["category"] or cat
                parsed["keywords"].append(kw)

    for mood, keywords in (taxonomy.get("mood_keywords") or {}).items():
        if any(kw in text for kw in keywords):
            parsed["mood"] = parsed["mood"] or mood

    stopwords = {"near", "the", "a", "an", "in", "at", "for", "and", "or", "nairobi", "kenya"}
    tokens = [t for t in re.findall(r"[a-z0-9]+", text) if t not in stopwords and len(t) > 2]
    parsed["keywords"].extend(tokens)
    parsed["keywords"] = list(dict.fromkeys(parsed["keywords"]))
    return parsed
