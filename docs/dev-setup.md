# Dev setup — Local development

## 1. Yêu cầu

| Công cụ | Version tối thiểu |
|---|---|
| Node.js | 20 LTS |
| pnpm | 9.x |
| JDK | 21 (Temurin) |
| Python | 3.12 |
| Poetry | 1.8 |
| Docker Desktop / Docker | 24 |
| Make | (khuyên dùng để chạy lệnh tóm tắt) |
| Git | 2.40+ |

Cài thêm:
- VS Code + extensions: `Volar`, `ESLint`, `Tailwind`, `EditorConfig`, `Lombok` (cho file Java khi mở), `Pylance`.
- Hoặc IntelliJ IDEA Ultimate cho phần Java.

## 2. Clone & bootstrap

```bash
git clone <repo> kaori-spa
cd kaori-spa
cp .env.example .env

# JS workspaces
pnpm install

# Java
./gradlew build -x test

# Python
poetry install --directory services/ai-service
poetry install --directory services/analytics-service
```

## 3. Hạ tầng local

```bash
docker compose up -d   # Postgres, Redis, Kafka, ClickHouse, MinIO, Mailpit
```

Cổng mặc định:
- Postgres `5433` (host) → `5432` (container), Redis `6379`, Kafka `9092`, ClickHouse `8123`, MinIO `9000/9001`, Mailpit `8025`.

## 4. Chạy backend Java

```bash
./gradlew :services:auth-service:bootRun
./gradlew :services:tenant-service:bootRun
# ... mỗi service một terminal hoặc dùng tilt/skaffold
```

Hoặc:
```bash
make run-java   # alias chạy 5 service core qua tilt
```

## 5. Chạy backend Python

```bash
cd services/ai-service
poetry run uvicorn kaori_ai.main:app --reload --port 8081
```

## 6. Chạy frontend

```bash
pnpm dev          # mở 4 portal qua turbo
# hoặc
pnpm --filter @kaori/branch-admin dev
```

Truy cập:
- Tenant Admin: http://localhost:3000
- Org Admin: http://localhost:3001
- Branch Admin: http://localhost:3002
- Client Web: http://localhost:3003

## 7. Seed dữ liệu

```bash
make seed
```

Chạy:
1. Flyway migrate.
2. Insert tenant `kaori-demo`, org `Natural Beauty`, 2 branch.
3. Insert 1 owner user `owner@natural.local` / `Owner@123` (đổi sau).
4. Import service từ `docs/pricing.md`.
5. Insert 50 khách hàng giả + lịch sử booking.

## 8. Test

```bash
make test           # tất cả
make test-fe        # frontend only
make test-be        # backend only
make e2e            # Playwright shard
```

## 9. Trouble shooting

| Triệu chứng | Khắc phục |
|---|---|
| Kafka container chậm khởi động | đợi 30s, kiểm `docker logs kafka` |
| Postgres connection refused | `docker compose down -v` rồi `up -d` lại |
| pnpm install lỗi peer | xoá `node_modules`, chạy `pnpm install --force` |
| Java memory error | tăng `-Xmx2g` trong `gradle.properties` |
| Frontend không hot reload | tắt antivirus quét folder `.next/` |

## 10. Quy ước commit

```
type(scope): tóm tắt ngắn

- type: feat|fix|chore|refactor|docs|test|perf
- scope: tên service/feature, vd: branch-admin, booking-service
```

Conventional Commits + PR template.
