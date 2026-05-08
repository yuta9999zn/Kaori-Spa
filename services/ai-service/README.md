# Kaori AI Service

Python (FastAPI) microservice cho LLM, chatbot khách hàng, trợ lý nội bộ, dịch tự động và recommendation.

## Cấu trúc

```
services/ai-service/
├── pyproject.toml
└── src/kaori_ai/
    ├── main.py                # FastAPI app entry
    ├── config.py              # pydantic-settings
    ├── gateway/llm.py         # LLM gateway (provider, cache, cost, redact)
    └── routers/
        ├── health.py
        ├── chat.py            # /v1/ai/chat (+/stream SSE)
        └── translate.py       # /v1/ai/translate
```

## Chạy local

```bash
cd services/ai-service
poetry install
poetry run uvicorn kaori_ai.main:app --reload --port 8090
```

Health: `curl http://localhost:8090/health`.

Test chat:
```bash
curl -X POST http://localhost:8090/v1/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"natural-beauty","locale":"vi","messages":[{"role":"user","content":"Combo VIO bao nhiêu tiền?"}]}'
```

## Trạng thái

`gateway/llm.py` hiện trả response stub đa ngôn ngữ. Khi thêm `ANTHROPIC_API_KEY` ở `.env`, plug `langchain-anthropic` vào trong `LLMGateway.complete()` (đã có comment TODO cụ thể). Khung chuẩn hoá rate-limit / cache / cost sẵn sàng để mở rộng.

## Bước tiếp theo

- Thay stub bằng provider thật (Anthropic Claude Opus 4.7 mặc định).
- Token bucket Redis cho rate-limit / tenant.
- Cache prompt → response (Redis SHA256 key, TTL 1h).
- Cost tracking → bảng `ai_usage` ở `kaori_ai` DB.
- Tool calling: `availability.search`, `booking.create_for_self`, `service.read`, `faq.search`.
- RAG: pgvector + embedding nightly job.
