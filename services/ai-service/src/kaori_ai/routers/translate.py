"""Auto-translate endpoint used by the admin to fill missing locales
in JSONB content fields (service names, articles, notification templates)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from kaori_ai.gateway import llm_gateway
from kaori_ai.gateway.llm import CompletionRequest, Message

router = APIRouter()

Locale = Literal["vi", "en", "ja", "zh", "ko"]


class TranslateRequest(BaseModel):
    tenantSlug: str
    sourceLocale: Locale
    sourceText: str = Field(..., min_length=1, max_length=4000)
    targetLocales: list[Locale]


class TranslateResponse(BaseModel):
    sourceLocale: Locale
    sourceText: str
    translations: dict[Locale, str]


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest) -> TranslateResponse:
    out: dict[Locale, str] = {}
    for tgt in req.targetLocales:
        if tgt == req.sourceLocale:
            out[tgt] = req.sourceText
            continue
        prompt = (
            f"Translate the following text from {req.sourceLocale} to {tgt}. "
            "Output only the translation, no commentary."
        )
        resp = await llm_gateway.complete(
            CompletionRequest(
                tenant_id=req.tenantSlug,
                user_id=None,
                messages=[
                    Message("system", prompt),
                    Message("user", req.sourceText),
                ],
                locale=tgt,
            )
        )
        out[tgt] = resp.content
    return TranslateResponse(
        sourceLocale=req.sourceLocale,
        sourceText=req.sourceText,
        translations=out,
    )
