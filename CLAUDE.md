# CLAUDE.md — Kaori Spa Platform

> Hướng dẫn dành cho Claude Code khi làm việc trên repository này. File này được nạp tự động vào context mỗi phiên.

---

## 1. Tổng quan dự án

**Kaori Spa** là một SaaS multi-tenant để quản lý chuỗi spa / beauty / triệt lông. Phân cấp:

```
Tenant (Kaori Platform)
└── Organization (vd: Natural Beauty, …)
    └── Branch (chi nhánh)
        ├── Staff
        ├── Rooms
        ├── Services
        ├── Customers
        └── Bookings
```

Có **3 portal admin** + **1 client website / tổ chức**:

| Portal | Vai trò | Thư mục mockup |
|---|---|---|
| Tenant Admin | Vận hành nền tảng (gói, tổ chức, audit, billing) | `quan-ly-tenant/` |
| Organization Owner | Chủ tổ chức quản lý nhiều chi nhánh, RBAC | `quan-ly-to-chuc/` |
| Branch Manager / Staff | Vận hành chi nhánh hằng ngày | `quan-ly-chi-nhanh/` |
| Client Website | Trang công khai của tổ chức (booking, dịch vụ) | `CLIENT WEBSITE .html` |

---

## 2. Kiến trúc kỹ thuật

| Tầng | Công nghệ |
|---|---|
| Frontend | TypeScript, Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend (core) | Java 21, Spring Boot 3, PostgreSQL, Redis, Kafka |
| Backend (AI/LLM) | Python 3.12, FastAPI, LangChain, vector store (pgvector) |
| Realtime | WebSocket (Socket.IO) + Kafka topic fan-out |
| Auth | OAuth2 / OIDC + JWT, RBAC theo tenant + org + branch scope |
| Big data | Kafka → ClickHouse cho analytics; PostgreSQL có sharding theo tenant |
| Quan sát | OpenTelemetry → Loki / Tempo / Prometheus / Grafana |
| i18n | `en`, `vi` (mặc định), `ja`, `zh`, `ko` |

Repo là **monorepo** dùng pnpm workspaces + Gradle multi-module + Poetry workspace. Xem `docs/architecture.md`.

---

## 3. Quy ước code

### Đặt tên & branding
- Brand chính: **Kaori** / **Kaori Spa**. Tất cả `AURA` / `aura_*` / `AuraDB` cũ phải đổi thành `Kaori` / `kaori_*` / `KaoriDB` khi port sang code mới.
- Natural Beauty là **tenant client mẫu**, không phải brand nền tảng.

### Frontend
- Mỗi feature ở `apps/<portal>/src/features/<feature>` (vd: `features/booking`, `features/customer`).
- Component dùng chung: `packages/ui`. Type / schema dùng chung: `packages/shared`.
- Form dùng `react-hook-form` + `zod`. Fetch dùng `@tanstack/react-query` + generated client từ OpenAPI.
- Mọi text hiển thị PHẢI đi qua i18n (`useTranslations()` của `next-intl`). Không hardcode tiếng Việt.

### Backend Java
- Package gốc: `vn.kaori.spa.<bounded-context>`. Một service = một bounded context (auth, tenant, org, branch, booking, service, customer, payment, inventory, notification, audit).
- Multi-tenant qua `tenant_id` ở mọi bảng + Hibernate filter mặc định bật.
- Mọi endpoint trả `ApiResponse<T>` chuẩn (success/error envelope). Exception đi qua `@RestControllerAdvice` global.
- Kafka topic theo pattern `kaori.<context>.<event>.v1`.

### Backend Python (AI)
- Package: `kaori_ai/<module>`. FastAPI router theo bounded context.
- LLM gateway một cửa, có rate-limit + cache + cost tracking. Không gọi provider trực tiếp ngoài gateway.
- Dùng `pydantic` v2 cho schema. Reuse type chung qua OpenAPI codegen.

### Database
- PostgreSQL: schema-per-bounded-context, mọi bảng có `tenant_id UUID NOT NULL` + index composite `(tenant_id, …)`.
- Migration: Flyway (Java side là chủ). Python services chỉ READ qua repository, không tạo bảng.
- Kafka outbox pattern cho domain event.

### Test
- Unit: JUnit 5 + AssertJ (Java) / pytest (Python) / Vitest (TS).
- Integration: Testcontainers cho Postgres + Kafka.
- E2E: Playwright cho mỗi portal, có cờ `--shard` để chạy song song.
- Coverage gate ≥ 80% cho service, ≥ 70% cho UI.

---

## 4. Bảo mật & RBAC

- Token JWT có claim `tid` (tenant), `oid` (org), `bid` (branch), `roles[]`, `perms[]`.
- Mọi handler bắt buộc gọi `PermissionGuard.require(action, scope)` — không tin frontend.
- Password: Argon2id. Refresh token rotate. Đăng nhập có 2FA TOTP (bật được/tổ chức).
- Audit log: mọi thay đổi entity quan trọng đẩy vào Kafka topic `kaori.audit.event.v1` → ClickHouse.
- Secret: chỉ qua Vault / env, không commit.

---

## 5. Quy trình làm việc với Claude

Khi user yêu cầu thêm tính năng:
1. Đọc mockup HTML tương ứng trong `quan-ly-*/` để hiểu UX dự kiến.
2. Đối chiếu với `docs/architecture.md` và `docs/roadmap.md` xem feature thuộc phase nào.
3. Tạo / cập nhật API contract trước (OpenAPI YAML) → generate client → implement backend → implement frontend → test.
4. Mọi text mới phải có key trong cả 5 file `messages/{en,vi,ja,zh,ko}.json`. Nếu chưa có bản dịch hoàn chỉnh, dùng key tiếng Anh và để TODO ở các ngôn ngữ khác.
5. Mọi bảng mới phải có Flyway migration + chỉ mục `tenant_id`.
6. Cập nhật test trong cùng PR. Không merge code không có test.

### Đừng làm gì
- Không hardcode chuỗi UI bằng tiếng Việt trong component.
- Không bỏ qua `tenant_id` trong query / index.
- Không gọi LLM trực tiếp ngoài `kaori_ai.gateway`.
- Không thêm dependency mới mà không cập nhật `docs/dependencies.md`.
- Không tạo file `.md` mới ở root nếu chưa hỏi — dùng thư mục `docs/`.

---

## 6. Tài liệu liên quan (đọc khi cần)

- `docs/architecture.md` — kiến trúc tổng thể, sơ đồ service.
- `docs/roadmap.md` — kế hoạch theo giai đoạn (M0 → M5).
- `docs/data-model.md` — ERD + bảng chính.
- `docs/rbac.md` — ma trận role × permission.
- `docs/i18n.md` — quy ước đa ngôn ngữ + danh sách locale.
- `docs/llm-chatbot.md` — kiến trúc AI / chatbot.
- `docs/realtime.md` — chiến lược WebSocket + Kafka.
- `docs/security.md` — threat model, kiểm soát.
- `docs/observability.md` — log / metric / trace.
- `docs/testing.md` — chiến lược test.
- `docs/pricing.md` — bảng giá thật để seed.
- `docs/dev-setup.md` — hướng dẫn chạy local.
