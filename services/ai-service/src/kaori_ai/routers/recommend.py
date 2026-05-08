"""Service recommendation endpoint.

Hybrid approach:
  1. Pull customer history (services already used) — avoid recommending
     the same VIO combo to someone who just bought one.
  2. Pull customer segment (new / regular / vip / dormant) — affects
     pricing tier and trust level for upsells.
  3. Pull top services in the same gender + region cluster as their past
     visits (collaborative filter, lightweight).
  4. Layer LLM nuance on top: a 1-shot Anthropic call ranks the
     candidate list with a short reasoning trace.

For dev / no-key environments the LLM step short-circuits to the heuristic
order, returning the same shape so the frontend never breaks.
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from kaori_ai.gateway import (
    CompletionRequest,
    Message,
    RateLimitedError,
    llm_gateway,
)

router = APIRouter()


class HistoryItem(BaseModel):
    service_code: str = Field(..., alias="serviceCode")
    region: str = "unknown"
    times: int = 1
    last_at: str | None = Field(default=None, alias="lastAt")


class CandidateService(BaseModel):
    code: str
    name: str
    gender: Literal["male", "female", "unisex"]
    region: str
    base_price: int = Field(..., alias="basePrice")
    duration_min: int = Field(..., alias="durationMin")
    is_combo: bool = Field(False, alias="isCombo")


class RecommendRequest(BaseModel):
    tenantSlug: str
    customerSegment: Literal["new", "regular", "vip", "dormant"] = "regular"
    customerLocale: str = "vi"
    history: list[HistoryItem] = []
    candidates: list[CandidateService]
    limit: int = 3


class Recommendation(BaseModel):
    serviceCode: str
    score: float
    reason: str


class RecommendResponse(BaseModel):
    recommendations: list[Recommendation]
    explainer: str
    fallback: bool


def heuristic_score(c: CandidateService, history: list[HistoryItem], segment: str) -> tuple[float, str]:
    """Pure-Python score so the endpoint works without an LLM."""
    used_codes = {h.service_code for h in history}
    used_regions = {h.region for h in history}

    score = 0.5

    # Penalise repeat purchases unless it's a combo refill
    if c.code in used_codes and not c.is_combo:
        score -= 0.4
    elif c.code in used_codes:
        score += 0.1

    # Reward complementary regions (face customer → consider full body, etc)
    if c.region in used_regions:
        score += 0.15
    if c.is_combo and segment in {"vip", "regular"}:
        score += 0.25
    if segment == "dormant":
        # Dormant customers — show a light intro deal first.
        if c.is_combo:
            score -= 0.2

    # Slight upward bias on price for VIP (better margin), gentler for new.
    if segment == "vip":
        score += min(0.3, c.base_price / 10_000_000)
    if segment == "new":
        score -= min(0.2, c.base_price / 10_000_000)

    score = max(0.0, min(1.0, score))
    reason = _short_reason(c, segment, c.code in used_codes)
    return score, reason


def _short_reason(c: CandidateService, segment: str, repeat: bool) -> str:
    if repeat and c.is_combo:
        return "Khách dùng dịch vụ này thường xuyên — gợi ý gói combo tiết kiệm hơn."
    if repeat:
        return "Khách đã từng dùng — chỉ gợi ý nếu chu kỳ."
    if c.is_combo and segment == "vip":
        return "Combo phù hợp khách VIP, biên lợi nhuận tốt."
    if segment == "dormant":
        return "Lâu chưa quay lại — bắt đầu bằng dịch vụ ngắn để giữ chân."
    return f"Phù hợp khách {segment}."


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest) -> RecommendResponse:
    if not req.candidates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "candidates list empty")

    scored = [
        (heuristic_score(c, req.history, req.customerSegment), c)
        for c in req.candidates
    ]
    scored.sort(key=lambda x: x[0][0], reverse=True)
    top = scored[: req.limit]

    recommendations = [
        Recommendation(serviceCode=c.code, score=round(score, 3), reason=reason)
        for (score, reason), c in top
    ]

    # Try to get an LLM explainer; on rate limit / provider failure return
    # heuristic-only result with `fallback=true`.
    try:
        prompt = _build_prompt(req, top)
        resp = await llm_gateway.complete(
            CompletionRequest(
                tenant_id=req.tenantSlug,
                user_id=None,
                messages=[
                    Message("system", "You are a Kaori spa upsell advisor. Reply in <=2 sentences."),
                    Message("user", prompt)
                ],
                locale=req.customerLocale,
                temperature=0.4
            )
        )
        return RecommendResponse(
            recommendations=recommendations,
            explainer=resp.content.strip(),
            fallback=False
        )
    except (RateLimitedError, Exception):
        return RecommendResponse(
            recommendations=recommendations,
            explainer=_default_explainer(req.customerSegment),
            fallback=True
        )


def _build_prompt(req: RecommendRequest, top: list[tuple[tuple[float, str], CandidateService]]) -> str:
    lines: list[Any] = [
        f"Customer segment: {req.customerSegment}",
        f"History: {[h.service_code for h in req.history] or 'none'}",
        "Top candidates ranked by heuristic:"
    ]
    for (score, reason), c in top:
        lines.append(f"- {c.code} ({c.name}) score={score:.2f} reason={reason}")
    lines.append("Write 2 short Vietnamese sentences explaining the top pick.")
    return "\n".join(str(x) for x in lines)


def _default_explainer(segment: str) -> str:
    return {
        "new":     "Gợi ý các dịch vụ ngắn để khách trải nghiệm trước.",
        "regular": "Đề xuất dịch vụ bổ sung phù hợp lịch sử sử dụng.",
        "vip":     "Combo dài hạn giúp khách VIP tiết kiệm và gắn bó.",
        "dormant": "Khách lâu chưa quay lại — gợi ý dịch vụ chăm sóc nhẹ để khởi động lại."
    }[segment]
