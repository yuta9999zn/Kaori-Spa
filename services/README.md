# Kaori — Backend services (Java)

Spring Boot 3 multi-module Gradle project. Java 21.

```
services/
├── shared-kernel/      # ApiResponse, AppException, TenantContext, PermissionGuard, exception handler
├── auth-service/       # /v1/auth — login, refresh, JWT, password (Argon2id)
├── tenant-service/     # /v1/public, /v1/tenant, /v1/orgs, /v1/branches
└── api-gateway/        # Spring Cloud Gateway routing
```

## Chạy thử (local)

```bash
# Postgres + Redis local trước
docker run -d --name pg -p 5433:5432 \
    -e POSTGRES_USER=kaori -e POSTGRES_PASSWORD=kaori postgres:16

# tạo 2 db
docker exec -it pg psql -U kaori -c "CREATE DATABASE kaori_auth; CREATE DATABASE kaori_tenant;"

cd services
./gradlew :auth-service:bootRun     # 8081
./gradlew :tenant-service:bootRun   # 8082
./gradlew :api-gateway:bootRun      # 8080
```

Health: `curl http://localhost:8081/actuator/health`.

## Test API public (không cần auth)

```bash
curl http://localhost:8080/v1/public/orgs/natural-beauty
```

Trả về tenant Natural Beauty + 2 chi nhánh Kim Mã đã được seed bởi Flyway.

## Bước tiếp theo (chưa có trong skeleton)

- Refresh token rotation (cần `sessions` repo + service).
- Đọc role/permission thật từ DB cho JWT (đang trả stub `CUSTOMER`).
- Endpoint quản lý tenants/orgs/branches (CRUD đầy đủ cho admin).
- Hibernate filter `tenant_filter` enable mặc định.
- Outbox pattern + Kafka publisher.
- Audit log aspect.
- Testcontainers integration test.
- mTLS cấu hình production.
- Migrate từ JdbcTemplate raw query sang JPA entity ở `tenant-service`.
