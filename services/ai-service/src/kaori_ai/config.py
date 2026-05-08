"""Runtime configuration loaded from env vars."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = Field("dev", alias="ENV")
    db_url: str = Field(
        "postgresql+asyncpg://kaori:kaori@localhost:5433/kaori_ai",
        alias="DB_URL",
    )
    redis_url: str = Field("redis://localhost:6379/0", alias="REDIS_URL")

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
        ]
    )

    # LLM provider configuration. Real keys must be loaded from a secrets
    # manager in production — never commit values.
    anthropic_api_key: str | None = Field(None, alias="ANTHROPIC_API_KEY")
    openai_api_key: str | None = Field(None, alias="OPENAI_API_KEY")
    default_provider: str = Field("anthropic", alias="LLM_DEFAULT_PROVIDER")
    default_model: str = Field("claude-opus-4-7", alias="LLM_DEFAULT_MODEL")
    max_tokens: int = Field(1024, alias="LLM_MAX_TOKENS")

    # Tenant rate limiting (per minute)
    rate_limit_chat_per_min: int = Field(30, alias="RL_CHAT_PER_MIN")


settings = Settings()
