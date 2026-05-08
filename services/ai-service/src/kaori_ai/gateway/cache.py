"""Redis-backed prompt → response cache + per-tenant rate limiter."""

from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import TYPE_CHECKING

from kaori_ai.config import settings

if TYPE_CHECKING:
    from kaori_ai.gateway.types import CompletionRequest

logger = logging.getLogger(__name__)


class _NoRedis:
    """Fallback when Redis is unavailable — disables cache + RL silently."""
    async def get(self, _k: str) -> bytes | None: return None
    async def setex(self, _k: str, _ttl: int, _v: bytes) -> None: pass
    async def incr(self, _k: str) -> int: return 0
    async def expire(self, _k: str, _ttl: int) -> None: pass


_redis: object | None = None


async def _get_redis():
    global _redis
    if _redis is not None:
        return _redis
    try:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(settings.redis_url, decode_responses=False)
        await _redis.ping()  # type: ignore[attr-defined]
    except Exception as ex:
        logger.warning("Redis unavailable, cache + rate-limit disabled: %s", ex)
        _redis = _NoRedis()
    return _redis


def cache_key(req: "CompletionRequest") -> str:
    h = hashlib.sha256()
    h.update(req.tenant_id.encode())
    h.update(b"|")
    h.update((req.model or "").encode())
    for m in req.messages:
        h.update(m.role.encode())
        h.update(b"\x1f")
        h.update(m.content.encode())
    return f"kaori:llm:cache:{h.hexdigest()}"


async def get_cached(req: "CompletionRequest") -> dict | None:
    r = await _get_redis()
    raw = await r.get(cache_key(req))  # type: ignore[attr-defined]
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


async def put_cached(req: "CompletionRequest", payload: dict, ttl_seconds: int = 3600) -> None:
    r = await _get_redis()
    await r.setex(cache_key(req), ttl_seconds, json.dumps(payload).encode())  # type: ignore[attr-defined]


async def check_rate_limit(tenant_id: str) -> bool:
    """Return True if request should proceed, False if rate limit hit."""
    r = await _get_redis()
    bucket = int(time.time() // 60)
    key = f"kaori:llm:rl:{tenant_id}:{bucket}"
    count = await r.incr(key)  # type: ignore[attr-defined]
    if count == 1:
        await r.expire(key, 70)  # type: ignore[attr-defined]
    return count <= settings.rate_limit_chat_per_min
