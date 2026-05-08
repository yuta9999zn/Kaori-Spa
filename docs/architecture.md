# Kiến trúc tổng thể — Kaori Spa Platform

## 1. Mục tiêu kiến trúc

| Mục tiêu | Cách tiếp cận |
|---|---|
| Multi-tenant | Mỗi tổ chức là một `tenant`; cô lập theo `tenant_id` ở mọi tầng (DB, cache, log, search). |
| Nhiều chi nhánh / tổ chức | Phân cấp Tenant → Organization → Branch; permission scope theo cấp. |
| Big data | Event-driven (Kafka), tách OLTP (Postgres) / OLAP (ClickHouse), partition theo `tenant_id` + `created_at`. |
| Realtime | WebSocket gateway (Socket.IO trên Node hoặc Spring Reactive) + Kafka topic phát tán. |
| Bảo mật | OAuth2 + RBAC + ABAC, audit log bất biến, mTLS giữa service. |
| LLM / Chatbot | Service Python độc lập, gateway hoá cuộc gọi LLM. |
| i18n 5 ngôn ngữ | `next-intl` ở FE; ICU MessageFormat; ngôn ngữ user lưu ở `users.locale`. |

## 2. Cấu trúc monorepo

```
kaori-spa/
├── apps/                          # Frontend Next.js
│   ├── tenant-admin/              # Cổng tenant admin
│   ├── org-admin/                 # Cổng chủ tổ chức
│   ├── branch-admin/              # Cổng chi nhánh
│   └── client-web/                # Site công khai (per-tenant theme)
│
├── services/                      # Backend microservices
│   ├── api-gateway/               # Spring Cloud Gateway / Kong
│   ├── auth-service/              # Java – OAuth2, RBAC
│   ├── tenant-service/            # Java – tenant, billing, packages
│   ├── org-service/               # Java – organization, branch, content
│   ├── booking-service/           # Java – lịch, slot, conflict
│   ├── catalog-service/           # Java – dịch vụ, gói, combo, giá
│   ├── customer-service/          # Java – CRM, loyalty
│   ├── inventory-service/         # Java – kho, mỹ phẩm
│   ├── payment-service/           # Java – giao dịch, hoá đơn
│   ├── notification-service/      # Java – email, SMS, push, in-app
│   ├── audit-service/             # Java – audit log + write to ClickHouse
│   ├── ai-service/                # Python – LLM, chatbot, recommendation
│   └── analytics-service/         # Python – báo cáo, ETL, ClickHouse query
│
├── packages/                      # Shared TS packages
│   ├── ui/                        # shadcn/ui + brand tokens
│   ├── shared/                    # Type, schema, constant
│   ├── i18n/                      # Messages 5 ngôn ngữ + helper
│   ├── api-client/                # Auto-generated OpenAPI client
│   └── config/                    # ESLint/TS/Tailwind preset
│
├── infra/                         # IaC + DevOps
│   ├── docker/
│   ├── k8s/
│   ├── terraform/
│   └── helm/
│
├── docs/                          # Tài liệu kỹ thuật
└── tools/                         # Script CLI, codegen
```

## 3. Sơ đồ service (high-level)

```
                ┌──────────────────────────┐
   Browsers ───▶│  Next.js Apps (4 portal) │
                └──────────────┬───────────┘
                               │ HTTPS / WSS
                               ▼
                ┌──────────────────────────┐
                │      API Gateway         │
                │ (auth, rate-limit, route)│
                └──────────────┬───────────┘
            ┌──────────────────┼─────────────────────────┐
            ▼                  ▼                         ▼
   ┌──────────────┐   ┌──────────────────┐      ┌──────────────┐
   │ Java Services│   │ Python AI Service│      │ Realtime GW  │
   │ (Spring Boot)│◀─▶│   (FastAPI)      │      │ (WebSocket)  │
   └──────┬───────┘   └────────┬─────────┘      └──────┬───────┘
          │                    │                       │
          ▼                    ▼                       ▼
   ┌──────────────┐   ┌──────────────────┐      ┌──────────────┐
   │ PostgreSQL   │   │  pgvector / S3   │      │   Redis      │
   │ (per BC)     │   │  + vector store  │      │  + Pub/Sub   │
   └──────┬───────┘   └──────────────────┘      └──────────────┘
          │
          │ outbox + CDC (Debezium)
          ▼
   ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐
   │  Kafka       │───▶│  ClickHouse    │───▶│  Grafana / BI    │
   └──────────────┘    └────────────────┘    └──────────────────┘
```

## 4. Multi-tenant strategy

- **Shared DB, shared schema**, isolate theo `tenant_id` (mặc định cho phần lớn service).
- **Tenant cao cấp** có thể nâng cấp lên schema riêng (option future).
- Mọi query bắt buộc qua `TenantAwareRepository` — Hibernate filter `tenant_filter` enable mặc định ở `@Filter`.
- Cache key luôn có prefix `t:{tenantId}:` để tránh leak qua tenant.
- Background job phân vùng theo tenant (Kafka consumer group + key partitioning).

## 5. Event flow ví dụ — đặt lịch

1. Client gửi `POST /bookings` qua API Gateway.
2. `booking-service` validate slot, ghi booking + outbox event `BookingCreated.v1`.
3. Outbox publisher đẩy event lên Kafka topic `kaori.booking.created.v1`.
4. Consumer:
   - `notification-service` gửi email + push xác nhận.
   - `realtime-gateway` đẩy WebSocket tới calendar đang mở của staff.
   - `analytics-service` ETL vào ClickHouse `fact_bookings`.
   - `audit-service` ghi audit row.
5. Nếu xung đột phòng / nhân viên, `booking-service` raise `BookingConflictException` → mapper trả `409` chuẩn.

## 6. Failure & resilience

- Mọi cuộc gọi liên service: retry exponential (3 lần) + circuit breaker (Resilience4j).
- Idempotency key bắt buộc cho tất cả mutation API (header `Idempotency-Key`).
- Outbox pattern bảo đảm at-least-once delivery; consumer phải idempotent.
- Background job chạy qua Quartz (Java) hoặc Celery (Python).

Xem tiếp `docs/security.md`, `docs/realtime.md`, `docs/data-model.md`.
