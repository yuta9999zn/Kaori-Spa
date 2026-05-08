"""LLM provider adapters.

Each provider implements the same `Provider` protocol. The gateway picks one
based on config + availability + per-tenant policy. Stub provider is kept as
the default so the service runs without API keys (useful in CI).
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from typing import Protocol

from kaori_ai.config import settings
from kaori_ai.gateway.types import CompletionRequest, CompletionUsage, Message

logger = logging.getLogger(__name__)


class Provider(Protocol):
    name: str

    async def complete(self, req: CompletionRequest) -> tuple[str, CompletionUsage, str]:
        """Return (content, usage, model_used)."""
        ...

    async def stream(self, req: CompletionRequest) -> AsyncIterator[str]:
        ...


class StubProvider:
    """Deterministic offline provider for dev / CI."""

    name = "stub"

    @staticmethod
    def _stub_reply(question: str, locale: str) -> str:
        if locale == "en":
            return (
                "Thanks for reaching out to Natural Beauty. Our most popular "
                "options are: V-I-O combo, full-body hair removal, and "
                "Yomogi herbal steam. Want me to find an open slot at "
                "Kim Mã 575 or 625?"
            )
        if locale == "ja":
            return (
                "Natural Beauty へお問い合わせありがとうございます。"
                "人気はVIOコンボ・全身脱毛・よもぎ蒸しです。"
                "Kim Mã 575または625の空き枠をお探ししましょうか?"
            )
        if locale == "zh":
            return (
                "感谢联系 Natural Beauty。最受欢迎的服务是 V-I-O 套餐、"
                "全身脱毛、艾草蒸熏。要为您查询 Kim Mã 575 或 625 的空档吗?"
            )
        if locale == "ko":
            return (
                "Natural Beauty에 문의해 주셔서 감사합니다. "
                "VIO 콤보, 전신 제모, 쑥찜질이 인기입니다. "
                "Kim Mã 575 또는 625에서 예약 가능한 시간을 찾아드릴까요?"
            )
        return (
            "Cảm ơn bạn đã liên hệ Natural Beauty. Các dịch vụ được yêu thích "
            "nhất là combo VIO, triệt lông toàn thân và xông Yomogi. Bạn muốn "
            "đặt lịch tại Kim Mã 575 hay 625 nhỉ?"
        )

    async def complete(self, req: CompletionRequest) -> tuple[str, CompletionUsage, str]:
        last_user = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
        reply = self._stub_reply(last_user, req.locale)
        usage = CompletionUsage(
            prompt_tokens=sum(len(m.content) // 4 for m in req.messages),
            completion_tokens=len(reply) // 4,
            cost_usd=0.0,
        )
        return reply, usage, "stub"

    async def stream(self, req: CompletionRequest) -> AsyncIterator[str]:
        import asyncio
        content, _, _ = await self.complete(req)
        for i in range(0, len(content), 12):
            await asyncio.sleep(0.04)
            yield content[i : i + 12]


class AnthropicProvider:
    """Real Anthropic Claude provider via langchain-anthropic.

    Cost figures are taken from the public price list at the time of writing
    and should be moved to config. Update when Anthropic publishes new tiers.
    """

    name = "anthropic"

    PRICE_PER_MTOK_IN = {
        "claude-opus-4-7": 15.0,
        "claude-sonnet-4-6": 3.0,
        "claude-haiku-4-5-20251001": 0.25,
    }
    PRICE_PER_MTOK_OUT = {
        "claude-opus-4-7": 75.0,
        "claude-sonnet-4-6": 15.0,
        "claude-haiku-4-5-20251001": 1.25,
    }

    def __init__(self, api_key: str) -> None:
        # Imported lazily so the service still boots without the dep installed.
        from langchain_anthropic import ChatAnthropic

        self._cls = ChatAnthropic
        self._api_key = api_key

    # Models that reject the `temperature` param (extended-thinking line).
    # Adjust as Anthropic publishes more.
    _NO_TEMPERATURE_MODELS = {"claude-opus-4-7", "claude-opus-4-7-1m"}

    def _build(self, model: str, max_tokens: int, temperature: float):
        kwargs: dict = {
            "model": model,
            "api_key": self._api_key,
            "max_tokens": max_tokens,
            "timeout": 30,
        }
        if model not in self._NO_TEMPERATURE_MODELS:
            kwargs["temperature"] = temperature
        return self._cls(**kwargs)

    @staticmethod
    def _to_lc(messages: list[Message]):
        from langchain_core.messages import (
            AIMessage,
            HumanMessage,
            SystemMessage,
        )
        out = []
        for m in messages:
            if m.role == "system":
                out.append(SystemMessage(content=m.content))
            elif m.role == "user":
                out.append(HumanMessage(content=m.content))
            else:
                out.append(AIMessage(content=m.content))
        return out

    def _cost(self, model: str, in_tok: int, out_tok: int) -> float:
        return (
            in_tok * self.PRICE_PER_MTOK_IN.get(model, 0) / 1_000_000
            + out_tok * self.PRICE_PER_MTOK_OUT.get(model, 0) / 1_000_000
        )

    async def complete(self, req: CompletionRequest) -> tuple[str, CompletionUsage, str]:
        model = req.model or settings.default_model
        chat = self._build(model, req.max_tokens or settings.max_tokens, req.temperature)
        result = await chat.ainvoke(self._to_lc(req.messages))
        meta = getattr(result, "usage_metadata", None) or {}
        in_tok = int(meta.get("input_tokens", 0))
        out_tok = int(meta.get("output_tokens", 0))
        usage = CompletionUsage(
            prompt_tokens=in_tok,
            completion_tokens=out_tok,
            cost_usd=self._cost(model, in_tok, out_tok),
        )
        content = result.content if isinstance(result.content, str) else str(result.content)
        return content, usage, model

    async def stream(self, req: CompletionRequest) -> AsyncIterator[str]:
        model = req.model or settings.default_model
        chat = self._build(model, req.max_tokens or settings.max_tokens, req.temperature)
        async for chunk in chat.astream(self._to_lc(req.messages)):
            text = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
            if text:
                yield text


def pick_provider() -> Provider:
    if settings.default_provider == "anthropic" and settings.anthropic_api_key:
        try:
            return AnthropicProvider(settings.anthropic_api_key)
        except Exception as ex:
            logger.warning("Failed to init Anthropic provider, falling back to stub: %s", ex)
    return StubProvider()
