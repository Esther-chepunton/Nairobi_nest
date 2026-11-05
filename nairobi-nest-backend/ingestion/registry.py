from ingestion.adapters.openstreetmap import OpenStreetMapAdapter
from ingestion.adapters.rss import RSSAdapter
from ingestion.adapters.wikipedia import WikipediaAdapter
from ingestion.config_loader import load_sources_config

_ADAPTER_CLASSES = {
    "openstreetmap": OpenStreetMapAdapter,
    "wikipedia": WikipediaAdapter,
    "rss": RSSAdapter,
}


def get_adapter(source_name: str):
    cls = _ADAPTER_CLASSES.get(source_name)
    if not cls:
        raise ValueError(f"Unknown adapter: {source_name}")
    config = load_sources_config()
    adapter_cfg = (config.get("adapters") or {}).get(source_name, {})
    if not adapter_cfg.get("enabled", True):
        raise ValueError(f"Adapter disabled: {source_name}")
    return cls(adapter_cfg, config)


def list_enabled_adapters():
    config = load_sources_config()
    adapters = config.get("adapters") or {}
    return [
        name
        for name, cfg in adapters.items()
        if cfg.get("enabled", True) and name in _ADAPTER_CLASSES
    ]
