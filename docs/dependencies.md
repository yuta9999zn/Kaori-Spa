# Dependencies — Danh sách thư viện chính

> Bất kỳ thay đổi (thêm / nâng cấp / xoá) phụ thuộc đều phải cập nhật file này trong cùng PR.

## Frontend (TypeScript / Next.js)

| Package | Vai trò |
|---|---|
| `next` | App Router, RSC |
| `react`, `react-dom` | UI |
| `typescript` | Type system |
| `tailwindcss`, `@tailwindcss/forms`, `@tailwindcss/typography` | Styling |
| `shadcn/ui` (copy) | Component primitives |
| `lucide-react` | Icon |
| `@tanstack/react-query` | Data fetching, cache |
| `react-hook-form`, `zod`, `@hookform/resolvers` | Form |
| `next-intl` | i18n |
| `socket.io-client` | Realtime |
| `dayjs` | Date |
| `clsx`, `tailwind-merge` | Class util |
| `recharts` | Chart |
| `framer-motion` | Animation |
| `vitest`, `@testing-library/react`, `msw`, `playwright` | Test |

## Backend Java (Spring Boot)

| Dependency | Vai trò |
|---|---|
| `spring-boot-starter-web`, `…-webflux` | HTTP, reactive (gateway) |
| `spring-boot-starter-data-jpa` | ORM |
| `spring-boot-starter-security` | Security |
| `spring-boot-starter-oauth2-resource-server` | JWT |
| `spring-cloud-starter-gateway` | API gateway |
| `spring-kafka` | Kafka |
| `flywaydb` | Migration |
| `org.postgresql:postgresql` | JDBC |
| `pgvector-jdbc` | Vector cột |
| `io.micrometer:micrometer-tracing-bridge-otel` | OpenTelemetry |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` | OpenAPI |
| `io.github.resilience4j:resilience4j-spring-boot3` | Circuit breaker |
| `mapstruct` + `lombok` | Mapping & boilerplate |
| `testcontainers`, `junit-jupiter`, `assertj` | Test |

## Backend Python (FastAPI)

| Package | Vai trò |
|---|---|
| `fastapi`, `uvicorn[standard]` | Web framework |
| `pydantic` v2 | Schema |
| `sqlalchemy` 2, `asyncpg` | DB |
| `pgvector` | Vector |
| `redis` (async) | Cache, rate-limit |
| `aiokafka` | Kafka |
| `httpx` | HTTP client |
| `langchain`, `langchain-anthropic`, `langchain-openai` | LLM orchestration |
| `tenacity` | Retry |
| `prometheus-fastapi-instrumentator` | Metric |
| `opentelemetry-instrumentation-fastapi` | Trace |
| `pytest`, `pytest-asyncio`, `respx` | Test |

## Infra

| Tool | Vai trò |
|---|---|
| Docker / Docker Compose | Local stack |
| Kubernetes + Helm | Prod |
| Terraform | Cloud IaC |
| GitHub Actions | CI/CD |
| Argo CD | GitOps deploy |
| Loki / Tempo / Prometheus / Grafana | Observability |
| Vault | Secrets |
