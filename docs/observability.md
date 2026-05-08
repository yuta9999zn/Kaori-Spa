# Observability — Log / Metric / Trace

## 1. Stack

- **Log**: Loki (gom log structured JSON từ mọi container) + Grafana panel.
- **Metric**: Prometheus + Grafana, exporter chuẩn Spring Boot Actuator / FastAPI Prometheus instrumentator.
- **Trace**: OpenTelemetry SDK ở mọi service → Tempo. Exemplars liên kết metric → trace.
- **Frontend**: Sentry (FE error) + Web Vitals → Prometheus.

## 2. Log

- Format JSON, mọi service phát ra cùng schema:
```
{ ts, level, service, env, tenant_id, user_id, trace_id, span_id, msg, ctx{...} }
```
- Cấp độ: `debug` (dev), `info` (prod), `warn`, `error`.
- Tuyệt đối không log password, token, OTP, body chứa PII chưa redact.
- Retention: 14 ngày live, 90 ngày archive S3 (gzipped).

## 3. Metric chuẩn

| Metric | Loại | Tag |
|---|---|---|
| `http_server_requests_seconds` | histogram | service, route, status, tenant_id |
| `db_pool_connections_active` | gauge | service |
| `kafka_consumer_lag` | gauge | service, topic, partition |
| `ws_connections_active` | gauge | tenant_id, branch_id |
| `bookings_created_total` | counter | tenant_id, branch_id |
| `ai_tokens_total` | counter | tenant_id, model |
| `ai_cost_usd_total` | counter | tenant_id, model |

## 4. Trace

- Mọi request HTTP có `traceparent` header. Service phải propagate qua REST + Kafka header.
- Span quan trọng: DB query (>50ms), call ngoại (LLM, payment), Kafka publish/consume.
- Sample: 100% error, 10% baseline, có thể tăng tạm thời qua dynamic config.

## 5. Alert

| Alert | Điều kiện | Severity |
|---|---|---|
| API 5xx ratio > 1% (5 phút) | service-level | P1 |
| Booking conflict rate spike | > baseline 3σ | P2 |
| Kafka consumer lag > 10k | per topic | P1 |
| AI cost daily > tenant cap | tenant-level | P3 |
| WebSocket drop > 5% | gateway | P2 |
| Audit log gap (no events 5 phút) | suspicious | P1 |
| DB connections > 80% pool | service | P2 |

Routing: Slack `#kaori-alert` + PagerDuty cho P1.

## 6. Dashboard có sẵn

- `Platform overview` — CPU/RAM/network mọi service.
- `Tenant view` — filter theo `tenant_id`: doanh thu, booking, error.
- `Branch ops` — booking realtime, no-show rate.
- `AI cost & usage` — chi phí + tokens / model / tenant.
- `Audit feed` — stream audit_events.

## 7. Health check

- `/actuator/health` (Java) / `/health` (Python) trả 200 + dependency status.
- K8s liveness 30s, readiness 5s.
- Đọc `/actuator/info` cho version + git sha.

## 8. SLO

| Service | SLO |
|---|---|
| API Gateway | 99.9% success, p95 < 300ms |
| Booking Service | 99.9% success, p95 < 500ms |
| AI Service | 99% success (đã loại tool error), p95 < 4s |
| WebSocket Gateway | 99% kết nối ổn định ≥ 5 phút |

Error budget burn rate alert ở 2x và 10x.
