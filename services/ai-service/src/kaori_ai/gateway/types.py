from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Role = Literal["system", "user", "assistant"]


@dataclass(frozen=True)
class Message:
    role: Role
    content: str


@dataclass(frozen=True)
class CompletionRequest:
    tenant_id: str
    user_id: str | None
    messages: list[Message]
    model: str | None = None
    max_tokens: int | None = None
    temperature: float = 0.7
    locale: str = "vi"


@dataclass(frozen=True)
class CompletionUsage:
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float


@dataclass(frozen=True)
class CompletionResponse:
    content: str
    usage: CompletionUsage
    model: str
    cached: bool
