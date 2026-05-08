"""Chat endpoints for the customer chatbot widget and admin assistants."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Header, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from kaori_ai.gateway import (
    CompletionRequest,
    Message,
    RateLimitedError,
    llm_gateway,
)

router = APIRouter()


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    tenantSlug: str = Field(..., examples=["natural-beauty"])
    locale: Literal["vi", "en", "ja", "zh", "ko"] = "vi"
    messages: list[ChatMessage]
    stream: bool = False


class ChatResponse(BaseModel):
    content: str
    model: str
    tokensIn: int
    tokensOut: int
    cached: bool


def _system_prompt(tenant_slug: str, locale: str) -> str:
    return (
        f"You are the Kaori AI assistant operating on behalf of tenant "
        f"'{tenant_slug}'. Reply in locale '{locale}'. "
        "Help customers explore services, branches and bookings for the "
        "Natural Beauty spa chain (Kim Mã 575 and Kim Mã 625 in Hanoi). "
        "Never reveal data from other tenants. Stay polite and concise."
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> ChatResponse:
    messages = [Message("system", _system_prompt(req.tenantSlug, req.locale))]
    messages.extend(Message(m.role, m.content) for m in req.messages)

    try:
        result = await llm_gateway.complete(
            CompletionRequest(
                tenant_id=req.tenantSlug,
                user_id=x_user_id,
                messages=messages,
                locale=req.locale,
            )
        )
    except RateLimitedError as ex:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(ex))

    return ChatResponse(
        content=result.content,
        model=result.model,
        tokensIn=result.usage.prompt_tokens,
        tokensOut=result.usage.completion_tokens,
        cached=result.cached,
    )


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    messages = [Message("system", _system_prompt(req.tenantSlug, req.locale))]
    messages.extend(Message(m.role, m.content) for m in req.messages)
    cr = CompletionRequest(
        tenant_id=req.tenantSlug,
        user_id=None,
        messages=messages,
        locale=req.locale,
    )

    async def event_stream():
        try:
            async for chunk in llm_gateway.stream(cr):
                yield f"data: {chunk}\n\n"
        except RateLimitedError as ex:
            yield f"event: error\ndata: rate_limited:{ex}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
