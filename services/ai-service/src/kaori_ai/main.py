"""Kaori AI service entry point.

FastAPI app exposing /v1/ai/* endpoints used by the client website chatbot
and admin assistants. All LLM calls go through `kaori_ai.gateway`.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from kaori_ai.config import settings
from kaori_ai.routers import chat, health, recommend, translate

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI service starting | env=%s", settings.env)
    yield
    logger.info("AI service stopping")


app = FastAPI(
    title="Kaori AI",
    version="0.1.0",
    description="Chatbot, LLM gateway, translation and recommendation service",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(health.router, tags=["health"])
app.include_router(chat.router, prefix="/v1/ai", tags=["chat"])
app.include_router(translate.router, prefix="/v1/ai", tags=["translate"])
app.include_router(recommend.router, prefix="/v1/ai", tags=["recommend"])
