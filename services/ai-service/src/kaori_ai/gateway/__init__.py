"""LLM gateway — single entry point for all model calls.

Responsibilities:
- Route to provider (Anthropic / OpenAI / local) per policy
- Per-tenant rate limit (Redis token bucket)
- Prompt + response cache (Redis, sha256 key)
- Cost tracking (writes ai_usage rows asynchronously)
- PII redaction before egress (when tenant has flag enabled)
- Streaming SSE
"""
from kaori_ai.gateway.llm import LLMGateway, RateLimitedError, llm_gateway  # noqa: F401
from kaori_ai.gateway.types import (  # noqa: F401
    CompletionRequest,
    CompletionResponse,
    CompletionUsage,
    Message,
)
