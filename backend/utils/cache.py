"""
Redis-backed cache with TTLCache fallback for local dev.
"""

import json
import logging
import os
from typing import Any, Optional

from cachetools import TTLCache

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "")
_redis_client = None
_fallback_cache = TTLCache(maxsize=512, ttl=300)


def _get_redis():
    global _redis_client
    if _redis_client is None and REDIS_URL:
        try:
            import redis

            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.warning(f"Redis unavailable, using in-memory cache: {e}")
            _redis_client = False
    return _redis_client if _redis_client else None


def cache_get(key: str) -> Optional[Any]:
    r = _get_redis()
    if r:
        val = r.get(key)
        return json.loads(val) if val else None
    return _fallback_cache.get(key)


def cache_set(key: str, value: Any, ttl: int = 300):
    r = _get_redis()
    if r:
        r.setex(key, ttl, json.dumps(value, default=str))
    else:
        _fallback_cache[key] = value


def cache_delete(key: str):
    r = _get_redis()
    if r:
        r.delete(key)
    elif key in _fallback_cache:
        del _fallback_cache[key]