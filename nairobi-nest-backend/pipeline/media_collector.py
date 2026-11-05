from datetime import datetime
from typing import List
from urllib.parse import urlparse

from app.models import PlaceMedia, db


def collect_media_for_place(place, images: List[str], source_name: str, license_note: str = ""):
    saved = []
    for idx, url in enumerate(images[:10]):
        if not url or not url.startswith("http"):
            continue
        parsed = urlparse(url)
        if parsed.hostname and parsed.hostname.startswith("127."):
            continue
        existing = PlaceMedia.query.filter_by(place_id=place.id, url=url).first()
        if existing:
            saved.append(existing)
            continue
        media = PlaceMedia(
            place_id=place.id,
            url=url,
            media_type="image",
            source_name=source_name,
            license=license_note,
            attribution_text=f"Image via {source_name}",
            is_primary=(idx == 0),
            fetched_at=datetime.utcnow(),
        )
        db.session.add(media)
        saved.append(media)
    db.session.commit()
    return saved
