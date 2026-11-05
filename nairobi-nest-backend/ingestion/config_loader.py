import os
from typing import Dict, Optional

import yaml

from config import Config

_config_cache: Optional[Dict] = None


def load_sources_config() -> Dict:
    global _config_cache
    if _config_cache is not None:
        return _config_cache
    path = Config.SOURCES_CONFIG_PATH
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            _config_cache = yaml.safe_load(f) or {}
    else:
        _config_cache = {}
    return _config_cache


def load_taxonomy_config() -> Dict:
    path = Config.TAXONOMY_CONFIG_PATH
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}
