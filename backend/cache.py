# =============================================================================
# EduTrack 3D — In-Memory Cache Module (cache.py)
# =============================================================================
# SUBJECT 2 (System Design): TTL-Based Caching for Faster Dashboard Access
#   - Uses a Python dictionary with a time-to-live (TTL) mechanism to cache frequently
#     requested data and reduce repeated database queries during peak hours.
#   - Keeps course information and dashboard results ready for quick retrieval,
#     especially during the 11:59 PM deadline rush.
# =============================================================================

import time
import logging
from typing import Any, Optional

logger = logging.getLogger("edutrack.cache")

# =============================================================================
# COURSE_CACHE: O(1) lookup dictionary with Time-To-Live (TTL)
# SUBJECT 2 (System Design): Reduces database round-trips for frequently
#   accessed data. TTL ensures staleness is bounded.
# =============================================================================

# Cache storage: { key: { "data": Any, "expires_at": float } }
COURSE_CACHE: dict = {}
_memory_cache = COURSE_CACHE

# Default TTL: 5 minutes (300 seconds) — balances freshness vs performance
DEFAULT_TTL = 300


def cache_get(key: str) -> Optional[Any]:
    """
    O(1) cache read. Returns cached data if key exists and hasn't expired.
    Returns None if key is missing or TTL has elapsed.
    """
    entry = COURSE_CACHE.get(key)
    if entry is None:
        return None
    if time.time() > entry["expires_at"]:
        # TTL expired — evict stale entry
        del COURSE_CACHE[key]
        logger.debug(f"Cache MISS (expired): {key}")
        return None
    logger.debug(f"Cache HIT: {key}")
    return entry["data"]


def cache_set(key: str, data: Any, ttl: int = DEFAULT_TTL) -> None:
    """
    O(1) cache write. Stores data with an expiration timestamp.
    SUBJECT 2 (System Design): TTL prevents stale data during
    deadline-heavy periods (e.g., 11:59 PM submission rushes).
    """
    COURSE_CACHE[key] = {
        "data": data,
        "expires_at": time.time() + ttl
    }
    logger.debug(f"Cache SET: {key} (TTL={ttl}s)")


def cache_invalidate(key: str) -> None:
    """Remove a specific cache entry (e.g., after deadline creation)."""
    if key in COURSE_CACHE:
        del COURSE_CACHE[key]
        logger.debug(f"Cache INVALIDATED: {key}")


def cache_clear() -> None:
    """Flush the entire cache. Used during testing or schema changes."""
    COURSE_CACHE.clear()
    logger.info("Cache CLEARED: All entries flushed.")


def get_cache_stats() -> dict:
    """Return cache statistics for monitoring/debugging."""
    now = time.time()
    total = len(COURSE_CACHE)
    active = sum(1 for v in COURSE_CACHE.values() if now < v["expires_at"])
    return {
        "total_entries": total,
        "active_entries": active,
        "expired_entries": total - active
    }
