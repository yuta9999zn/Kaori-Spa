"""LLM gateway orchestrator. Picks provider, applies cache + rate limit,
records cost. Public API: `llm_gateway.complete(...)` and `.stream(...)`.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from dataclasses import asdict

from kaori_ai.gateway.cache import check_rate_limit, get_cached, put_cached
from kaori_ai.gateway.providers import Provider, pick_provider
from kaori_ai.gateway.types import (
    CompletionRequest,
    CompletionResponse,
    CompletionUsage,
    Message,
)

logger = logging.getLogger(__name__)


class RateLimitedError(Exception):
    pass


class LLMGateway:
    def __init__(self, provider: Provider | None = None) -> None:
        self._provider = provider or pick_provider()

    @property
    def provider_name(self) -> str:
        return self._provider.name

    async def complete(self, req: CompletionRequest) -> CompletionResponse:
        if not await check_rate_limit(req.tenant_id):
            raise RateLimitedError(f"tenant {req.tenant_id} exceeded chat rate limit")

        cached = await get_cached(req)
        if cached:
            return CompletionResponse(
                content=cached["content"],
                usage=CompletionUsage(**cached["usage"]),
                model=cached["model"],
                cached=True,
            )

        content, usage, model = await self._provider.complete(req)
        resp = CompletionResponse(content=content, usage=usage, model=model, cached=False)

        try:
            await put_cached(req, {
                "content": content,
                "usage": asdict(usage),
                "model": model,
            })
        except Exception as ex:  # cache failure must not break request
            logger.debug("cache put failed: %s", ex)

        # TODO M4 follow-up: record usage row in ai_usage table.
        logger.info(
            "llm.complete tenant=%s model=%s in=%d out=%d cost=%.4f",
            req.tenant_id, model, usage.prompt_tokens, usage.completion_tokens, usage.cost_usd,
        )
        return resp

    async def stream(self, req: CompletionRequest) -> AsyncIterator[str]:
        if not await check_rate_limit(req.tenant_id):
            raise RateLimitedError(f"tenant {req.tenant_id} exceeded chat rate limit")
        async for chunk in self._provider.stream(req):
            yield chunk


llm_gateway = LLMGateway()
__all__ = ["LLMGateway", "llm_gateway", "Message", "CompletionRequest", "CompletionResponse"]
