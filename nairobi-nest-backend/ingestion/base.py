from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from hashlib import sha256
import json
from typing import Any, Dict, List, Optional


@dataclass
class RawRecord:
    source_name: str
    source_id: str
    payload: Dict[str, Any]
    source_url: str = ""
    fetched_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def content_hash(self) -> str:
        raw = json.dumps(
            {"source_id": self.source_id, "payload": self.payload},
            sort_keys=True,
            default=str,
        )
        return sha256(raw.encode()).hexdigest()


@dataclass
class NormalizedPlaceDraft:
    name: str
    category: str
    source_name: str
    source_id: str
    location_name: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: str = ""
    tags: List[str] = field(default_factory=list)
    opening_hours: Dict[str, Any] = field(default_factory=dict)
    price_min: int = 0
    price_max: int = 0
    external_website: str = ""
    source_url: str = ""
    raw_confidence: float = 0.5
    images: List[str] = field(default_factory=list)
    moods: List[str] = field(default_factory=list)
    companions: List[str] = field(default_factory=list)
    fetched_at: datetime = field(default_factory=datetime.utcnow)


class SourceAdapter(ABC):
    source_name: str = "unknown"
    reliability_weight: float = 0.5

    @abstractmethod
    def fetch(self, cursor: Optional[Dict[str, Any]] = None) -> tuple[List[RawRecord], Optional[Dict[str, Any]]]:
        """Return batch of raw records and optional next cursor."""

    @abstractmethod
    def normalize(self, raw: RawRecord) -> Optional[NormalizedPlaceDraft]:
        """Map raw record to normalized draft; return None to skip."""

    def is_allowed(self) -> bool:
        return True
