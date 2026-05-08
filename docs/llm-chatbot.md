# LLM & Chatbot

## 1. Vai trò trong hệ thống

3 use case chính:

| Use case | Mô tả | Mức |
|---|---|---|
| **Khách hàng chatbot** | Tư vấn dịch vụ, đặt lịch, FAQ, tra cứu lịch sử | M4 — public |
| **Trợ lý nội bộ** | Tóm tắt khách hàng, gợi ý upsell, viết nội dung marketing | M4 — admin |
| **Phân loại & gợi ý** | Sentiment review, gợi ý dịch vụ, dự đoán no-show | M5 |

## 2. Kiến trúc

```
┌────────────────────┐        ┌────────────────────────┐
│ Client / Admin UI  │──────▶ │  ai-service (FastAPI)  │
└────────────────────┘        │  - /chat               │
                              │  - /summarize          │
                              │  - /recommend          │
                              │  - /i18n/translate     │
                              │                        │
                              │  ┌──────────────────┐  │
                              │  │  LLM Gateway     │  │
                              │  │  rate-limit,     │  │
                              │  │  cache, cost     │  │
                              │  └──────┬───────────┘  │
                              └─────────┼──────────────┘
                                        │
                       ┌────────────────┼─────────────────┐
                       ▼                ▼                 ▼
                   Anthropic        OpenAI            Local model
                   (default)        (fallback)        (optional)

                              ┌────────────────────────┐
                              │  Vector store          │
                              │  pgvector (embedding)  │
                              └────────────────────────┘
```

## 3. LLM Gateway

Module nội bộ trong `ai-service`. Mọi endpoint phải đi qua đây.

Trách nhiệm:
- Pick provider theo policy (cost, latency, availability, fallback).
- Rate limit theo `tenant_id` + `user_id`.
- Caching prompt + response (Redis, key = sha256(prompt + model + params)).
- Cost tracking → bảng `ai_usage`.
- PII redaction: tự động che số điện thoại, email, CMND/CCCD trước khi gửi nếu org bật `pii_redaction`.
- Streaming SSE cho UI realtime.
- Tool/function calling chuẩn hoá schema (booking_create, customer_lookup, …).

## 4. RAG cho chatbot

- Index: dịch vụ, FAQ, chính sách hoàn huỷ, hồ sơ khách hàng (chỉ cho assistant nội bộ).
- Embedding model: `text-embedding-3-small` (default) hoặc local `bge-m3` (option offline).
- Pipeline: ETL nightly + on-write hook khi entity thay đổi.
- Top-k = 8, rerank bằng `bge-reranker` nếu được bật.
- Mỗi truy vấn lọc theo `tenant_id` + scope visibility — không leak dữ liệu giữa tenant.

## 5. Chatbot khách hàng — flow đặt lịch

1. Khách mở widget `/chat` trên website.
2. AI hỏi dịch vụ, thời điểm, chi nhánh (gợi ý dựa lịch sử nếu đã đăng nhập).
3. AI gọi tool `availability.search(branch_id, service_id, date_range)` → `booking-service`.
4. Khách chọn slot. AI gọi tool `booking.create(...)` (có dry-run trước).
5. Trả về QR + xác nhận. Đẩy notification.
6. Toàn bộ hội thoại lưu vào `ai_conversations` + `ai_messages` để audit.

## 6. Bảo mật

- Mọi prompt template lưu version (`prompts/<name>/v<n>.txt`), tránh prompt drift.
- System prompt nhúng `tenant_id` và quy tắc cứng: không tiết lộ dữ liệu tenant khác, không thực hiện hành động vượt scope.
- Tool call có whitelist theo role của caller. Người dùng `CUSTOMER` chỉ gọi được `availability.*`, `booking.create_for_self`, `service.read`, `faq.search`.
- Output AI bắt buộc qua filter (toxic, jailbreak, PII leak) trước khi trả client.
- Log đầy đủ prompt + response + cost vào ClickHouse cho điều tra.

## 7. Đa ngôn ngữ

- Phát hiện ngôn ngữ tự động từ message đầu tiên; user có thể override.
- System prompt thêm yêu cầu trả lời theo `target_locale`.
- Service `/i18n/translate` dùng cho tự động dịch nội dung quản trị.

## 8. Cost & quota

- Tenant có quota tokens/tháng theo `plan_features.ai_tokens_monthly`.
- Hết quota → nâng cấp / chờ chu kỳ. Trợ lý nội bộ ưu tiên user role cao hơn.
- Dashboard chi phí trong Tenant Admin.

## 9. Đánh giá chất lượng

- Bộ test prompt regression (`tests/ai/golden/`) chạy hằng tuần.
- Người dùng có thể 👍 / 👎 mỗi câu trả lời → đẩy vào `ai_feedback` để fine-tune sau.
