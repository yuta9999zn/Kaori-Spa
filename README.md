# Kaori Spa Platform

> Multi-tenant SaaS để vận hành chuỗi spa / beauty / triệt lông. Tổ chức seed: **Natural Beauty** với 2 chi nhánh tại 575 Kim Mã & 625 Kim Mã, Hà Nội.

## Trạng thái phiên xây dựng

| Phase | Mô tả | Trạng thái |
|---|---|---|
| 0 | Tài liệu kiến trúc + roadmap + bảng giá thật | ✅ |
| 1 | Backend Java (auth, tenant, gateway, Flyway) | ✅ skeleton |
| 2 | Branch admin portal (Next.js) | ✅ skeleton + 3 trang |
| 3 | Org admin portal (Next.js) | ✅ skeleton + 4 trang |
| 4 | Tenant admin portal (Next.js) | ✅ skeleton + 3 trang |
| 5 | AI service Python (FastAPI) + Chatbot widget | ✅ stub đa ngôn ngữ |
| 6 | SEO polish: hreflang, sitemap, robots, JSON-LD, manifest | ✅ |
| A | LLM provider thật (Anthropic Claude) + Redis cache + rate limit | ✅ |
| B | Refresh token rotation single-use (sessions table) | ✅ |
| C | CRUD org/branch (Spring Data JPA + JSONB i18n field) | ✅ |
| D | Realtime WebSocket gateway (WebFlux) + Kafka fan-out | ✅ |
| E | Kafka outbox publisher (shared-kernel) + notification listener | ✅ |
| F | Audit aspect tự động (`@Audited` AOP → Kafka) | ✅ |
| G | Testcontainers integration test cho login + refresh + lockout | ✅ |
| H | Docker Compose: Postgres / Redis / Kafka / ClickHouse / MinIO / Mailpit + 6 service | ✅ |
| I | GitHub Actions CI: frontend × 4, java, python, i18n parity, semgrep, multi-arch image build | ✅ |

## Cấu trúc

```
.
├── CLAUDE.md
├── README.md
├── package.json              # pnpm workspace
├── pnpm-workspace.yaml
│
├── apps/
│   ├── client-web/           # Trang công khai Natural Beauty (port 3003)
│   ├── branch-admin/         # Portal chi nhánh           (port 3002)
│   ├── org-admin/            # Portal chủ tổ chức         (port 3001)
│   └── tenant-admin/         # Portal Kaori platform      (port 3000)
│
├── services/
│   ├── settings.gradle.kts
│   ├── build.gradle.kts
│   ├── shared-kernel/        # ApiResponse, exception, RBAC, tenant ctx
│   ├── auth-service/         # /v1/auth (Spring Boot, port 8081)
│   ├── tenant-service/       # /v1/public, /v1/tenant     (port 8082)
│   ├── api-gateway/          # Spring Cloud Gateway       (port 8080)
│   └── ai-service/           # Python FastAPI             (port 8090)
│
├── docs/                     # Tài liệu kỹ thuật chi tiết (13 file)
└── (mockup HTML cũ giữ làm tham chiếu UX)
```

## i18n — 5 ngôn ngữ

`vi` (mặc định) · `en` · `ja` · `zh` · `ko`. Chuyển ngôn ngữ ở góc phải mỗi portal. Mỗi app có thư mục `messages/` với 5 file JSON.

## Tài khoản seed

| Email | Vai trò | Phạm vi | Họ tên (nickname) |
|---|---|---|---|
| `owner@naturalbeauty.vn` | ORG_OWNER | Natural Beauty | (chủ tổ chức) |
| `miko@naturalbeauty.vn` | BRANCH_MANAGER | Kim Mã 575 | **Nguyễn Khánh Linh** (miko) |
| `huong@naturalbeauty.vn` | BRANCH_MANAGER | Kim Mã 625 | **Nguyễn Lan Hương** (hương) |

Mật khẩu mặc định dev: `Manager@2026` (đổi trước khi lên prod).

## Chạy thử

### Frontend
```bash
pnpm install
pnpm dev                 # bật cùng lúc 4 app
# hoặc từng app:
pnpm dev:client          # http://localhost:3003
pnpm dev:branch          # http://localhost:3002
pnpm dev:org             # http://localhost:3001
pnpm dev:tenant          # http://localhost:3000
```

### Backend Java
```bash
cd services
./gradlew :auth-service:bootRun     # 8081
./gradlew :tenant-service:bootRun   # 8082
./gradlew :api-gateway:bootRun      # 8080
```

### AI service
```bash
cd services/ai-service
poetry install
poetry run uvicorn kaori_ai.main:app --reload --port 8090
```

## Tài liệu

- `CLAUDE.md` — định hướng cho Claude Code khi làm việc trên repo
- `docs/architecture.md` — kiến trúc tổng thể
- `docs/roadmap.md` — lộ trình M0 → M5
- `docs/data-model.md` — bảng DB
- `docs/rbac.md` — ma trận quyền
- `docs/i18n.md` — quy ước đa ngôn ngữ
- `docs/llm-chatbot.md` — kiến trúc AI
- `docs/realtime.md` — WebSocket + Kafka
- `docs/security.md` — threat model
- `docs/observability.md` — log/metric/trace
- `docs/testing.md` — chiến lược test
- `docs/pricing.md` — bảng giá thật seed DB
- `docs/dependencies.md` — danh sách thư viện chính
- `docs/dev-setup.md` — hướng dẫn chạy local

## License

Proprietary — © 2026 Kaori Spa Platform.
