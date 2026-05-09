# Kaori Spa — Scaling Strategy

> Tài liệu reference dài hạn về cách hệ thống xử lý big-data và high-concurrency. Mỗi phần liệt kê (a) vấn đề điển hình ở scale, (b) giải pháp đa lớp, (c) trạng thái hiện tại của Kaori (đã có / đang làm / defer).

Multi-tenant SaaS: 1 platform → N tenant → N×M chi nhánh → N×M×K nhân viên × triệu booking. Decision optimization phải bám theo tenant_id ở mọi tầng.

---

## 1. Error / log tsunami

**Kịch bản:** 1 deploy lỗi → 100k user đồng thời gặp exception → frontend của tất cả gửi error report → millions of messages về server. Hoặc bot quét endpoint, gây 4xx flood.

**Giải pháp đa lớp:**

| Lớp | Kỹ thuật | Trạng thái |
|---|---|---|
| Frontend | Sampling 1/100, client rate-limit (5 errors/min/user), debounce, batch report | ⏳ Defer |
| API gateway | Token bucket rate-limit per IP/user/tenant, 429 + Retry-After | ⏳ Round 7 (Bucket4j) |
| Backend | Structured log với dedup key (hash of stacktrace + endpoint), Loki dedupe upstream | 🟡 Loki configured, dedup key chưa có |
| Storage | Kafka topic `kaori.client.error.v1` partition by tenant; ClickHouse aggregate; S3 cold; KHÔNG raw vào Postgres | ⏳ Defer |
| Alerting | Threshold-based (alert chỉ khi error rate > X/min trong 5 min liên tiếp) | ⏳ Defer |

**Key insight:** Log không bao giờ throw raw vào Postgres. Phải qua Kafka (lossy buffer), rồi process async vào ClickHouse cho analytics, S3/MinIO cho cold storage. ClickHouse có thể handle billions of audit/log events.

**Cardinality control:** Prometheus metrics KHÔNG label theo `user_id` hoặc `request_id` (sẽ explode). Chỉ label `tenant_id`, `endpoint`, `status_code`, `service`.

---

## 2. Database query scaling

**Kịch bản:** Tenant lớn 200 chi nhánh × 10k khách × 5 năm = 10M+ booking. `SELECT * FROM bookings WHERE tenant_id=X` chết.

### 2.1 Indexing strategy

**Quy tắc vàng:** `tenant_id` luôn là cột đầu tiên trong mọi composite index. Postgres planner sẽ dùng nó để eliminate cross-tenant data ngay từ đầu.

| Bảng | Index hiện tại | Còn thiếu |
|---|---|---|
| `auth.audit_event` | `(tenant_id, ts DESC)`, `(action)`, `(actor_id)` | OK |
| `booking.bookings` | `(tenant_id, branch_id)`, basic | Cần `(tenant_id, branch_id, start_at DESC)` cho list page |
| `booking.booking_items` | partial | Cần index trên `staff_id` + `start_at` cho leaderboard |
| `customer.customers` | `(tenant_id, phone)` unique | OK |
| `notification.inbox_notification` | partial unread | OK |
| `tenant.audit_event` | OK | OK |

**Round 7 audit:** add missing composite indexes. Use `EXPLAIN ANALYZE` trên top 10 query nóng để verify.

**Partial indexes:**
- `WHERE deleted_at IS NULL` cho soft-delete
- `WHERE status IN ('pending', 'confirmed')` cho active bookings
- `WHERE read_at IS NULL` cho unread notifications (đã có)

### 2.2 Partitioning

**Khi data > 100M rows:**
- `bookings` partition theo `start_at` (RANGE monthly)
- `audit_event` partition theo `ts` (RANGE weekly), TTL drop > 90 ngày
- `booking.expense` partition theo `occurred_at` (yearly đủ)

Postgres declarative partitioning. Application không cần biết — Postgres routes query đến đúng partition.

```sql
CREATE TABLE booking.bookings_y2026m05 PARTITION OF booking.bookings
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

### 2.3 Sharding (khi 1 node Postgres không đủ)

3 chiến lược, tăng dần độ phức tạp:

1. **Schema-per-tenant** cho top 10 tenant lớn nhất, shared schema cho phần còn lại. Pattern: `kaori.tenant_<uuid>.bookings`. Hibernate `MultiTenantConnectionProvider`.
2. **CITUS** Postgres extension — tự động shard theo `tenant_id`, distributed query.
3. **App-level sharding** — routing layer trước Postgres, hash(tenant_id) → shard N. Phức tạp nhất.

**Khuyến nghị:** chờ đến khi 1 tenant > 10GB hoặc total > 500GB mới shard. Trước đó tối ưu indexing + read replica.

### 2.4 Read replicas

- **Master**: writes + critical reads (booking creation, payment)
- **Replicas (2-3)**: reports, dashboard, analytics
- **Routing**: Spring `@Transactional(readOnly=true)` → `LazyConnectionDataSourceProxy` resolver. Methods đọc ánh xạ vào replica, methods ghi vào master.

```java
@Transactional(readOnly = true)
public Page<Booking> list(...) { /* hits replica */ }
```

### 2.5 Materialized views

Refresh hourly thay vì compute mỗi request:
- `report.daily_revenue_mv` — aggregate by (tenant_id, branch_id, day)
- `report.top_services_mv` — service ranking by month
- `report.staff_performance_mv` — therapist KPI

Refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY` — không khoá table.

### 2.6 Pagination

**Mọi list endpoint:** `size <= 100` cap. **Round 7 audit** sẽ verify.

**Cursor-based** (keyset) cho infinite scroll thay vì OFFSET:

```sql
-- Bad: OFFSET 10000 scan 10k rows
SELECT * FROM bookings ORDER BY start_at DESC OFFSET 10000 LIMIT 20;

-- Good: keyset, sub-millisecond
SELECT * FROM bookings WHERE (start_at, id) < (?, ?) ORDER BY start_at DESC, id DESC LIMIT 20;
```

Audit log + bookings list nên migrate sang cursor pattern.

---

## 3. Real-time / WebSocket scaling

**Kịch bản:** 10k therapist online cùng lúc → memory + connection limit của 1 node realtime-gateway.

| Vấn đề | Giải pháp |
|---|---|
| Connection > pod limit | Sticky sessions với consistent hash by `user_id`. Horizontal scale 5k connections/pod. |
| Cross-instance fan-out | Kafka topic `kaori.realtime.event.v1`. Gateway A nhận event → Kafka → Gateway B,C deliver. |
| Slow client backlog | Backpressure: drop messages cho user có queue > 1000. |
| Idle connections | Heartbeat + TTL: auto-disconnect idle > 5 min. |
| Reconnection storm | Exponential backoff + jitter trong client SDK. |

Realtime-gateway hiện đã có Kafka fan-out pattern. Cần thêm backpressure + reconnect strategy.

---

## 4. Caching layer

| Data | Cache | TTL | Strategy | Trạng thái |
|---|---|---|---|---|
| User permissions (RBAC) | Caffeine L1 + Redis L2 | 5 min | Invalidate via Kafka `auth.user_role.changed.v1` | ⏳ Round 7 |
| Tenant config (domain/branding) | Redis | 1 h | Invalidate on PUT | ⏳ Defer |
| Service catalog | Caffeine local | 10 min | Read-through | ⏳ Defer |
| Customer detail | Redis | 30s | Cache-aside | ⏳ Defer |
| Reports | Redis | 5 min | Pre-warm via cron | ⏳ Defer |
| Static assets | CDN (Cloudflare) | 1 year | Filename hash cache-busting | ⏳ Defer |

**Cache invalidation pattern:** mỗi service emit Kafka event khi data thay đổi → tất cả service consume → evict từ cache local. Tránh stale data > 30s.

---

## 5. Async processing (Kafka)

Mọi heavy work → async qua Kafka:

| Việc | Topic | Worker |
|---|---|---|
| Booking confirm email/SMS | `kaori.notification.send.v1` | notification-service |
| Report generation | `kaori.report.generate.v1` | report-worker → S3 → notify user |
| Image upload | `kaori.image.process.v1` | image-worker resize 4 size → CDN |
| Bulk customer import | `kaori.customer.import.v1` | batch-processor |
| Audit event | `kaori.audit.event.v1` | clickhouse-sink + postgres-mirror | ✅ Implemented |

**Outbox pattern:** Domain event → `outbox` table → CDC poller (Debezium hoặc Spring scheduled) → Kafka. Đảm bảo at-least-once delivery, không mất event nếu service crash giữa transaction. ✅ Booking-service đã có.

**Saga pattern** cho distributed transaction: booking-create → payment-process → loyalty-credit. Nếu step nào fail, emit compensating event. Không dùng 2-phase commit.

---

## 6. Analytics scale

- **ClickHouse** cho OLAP queries (revenue trends, customer cohorts, heatmaps). Postgres KHÔNG dùng cho analytics > 100k rows scan.
- **ETL pipeline:** Postgres → Debezium CDC → Kafka topic per table → ClickHouse (real-time mirror, ~5s lag).
- **Pre-computed cubes** trong ClickHouse: dimension (tenant, branch, day, service) × metric (revenue, bookings, new customers). Use AggregatingMergeTree.
- **API:** chỉ analytics-service được phép query ClickHouse, expose qua HTTP cho FE. Không expose trực tiếp.

**Trạng thái:** ClickHouse ở docker-compose, audit events route qua Kafka. Còn thiếu Debezium CDC + analytics-service HTTP layer.

---

## 7. File / asset

- **S3-compatible** (MinIO local, S3 prod) — KHÔNG lưu binary trong Postgres.
- **Multipart upload** cho file > 5MB.
- **Pre-signed URL** cho upload trực tiếp client → S3, server chỉ issue URL (không proxy bytes).
- **Image pipeline:** Kafka event `kaori.image.process.v1` → worker → resize 4 size (thumb 64px / sm 200px / md 800px / lg 1920px) → CDN.

**Trạng thái:** chưa implement. Branding logo/avatar/cover hiện chỉ accept URL string. Round 8+.

---

## 8. Multi-tenant resource isolation

**Noisy neighbor:** 1 tenant lớn dùng quá nhiều resource → tenant nhỏ bị ảnh hưởng.

| Resource | Isolation | Trạng thái |
|---|---|---|
| API rate | Per-tenant token bucket trong Redis (Bucket4j) | ⏳ Round 7 |
| DB connection | HikariCP với `tenant_id` tracking, max conn per tenant tier | ⏳ Defer |
| CPU/memory | Kubernetes pods per tenant tier (gold/silver/bronze) | ⏳ Defer |
| Background jobs | Kafka consumer group per tier với priority queue | ⏳ Defer |
| Storage quota | Per-tenant byte limit, alert at 80% | ⏳ Defer |

**Tenant tier model:**
- **Gold (paying enterprise):** dedicated pod, no rate limit, 100 conn
- **Silver (pro):** shared pod, 1000 req/min, 20 conn
- **Bronze (starter):** shared pod, 100 req/min, 5 conn

Tier load từ `tenant.tenants.plan` column (đã có).

---

## 9. Observability

- **OpenTelemetry** distributed tracing — span propagate `tenant_id` qua W3C baggage. Mỗi request có traceId xuyên suốt 5-10 services.
- **Loki** logs với label `tenant_id`, `branch_id`, `service`, `level`. Tránh label cardinality cao như `user_id`.
- **Prometheus** metrics: business metrics (booking_created_total, revenue_vnd_sum) + system (jvm_memory_used_bytes, http_request_duration_seconds histogram).
- **Grafana** dashboards per tenant tier; oncall view với top errors + latency.
- **Alert rules:**
  - Error rate > 1% trong 5 min → page oncall (Slack + PagerDuty)
  - p99 latency > 1s → warning
  - DB connection pool > 80% → warning
  - Disk > 90% → page
  - Queue lag > 1 min → warning

**Trạng thái:** Loki/Tempo/Prometheus/Grafana ở docker-compose. OpenTelemetry instrumentation chưa add đầy đủ.

---

## 10. API gateway / circuit breaker

- **Resilience4j** circuit breaker per downstream service: open after 50% errors trong 10s sliding window, half-open sau 30s.
- **Bulkhead:** separate thread pool per critical operation. Booking-create không share thread pool với report-generate (slow op không block fast op).
- **Timeouts** aggressive (200ms p99) cho user-facing endpoints, 30s cho async/report.
- **Retry với exponential backoff + jitter,** max 3 retries, idempotency key required cho POST tránh duplicate.

```yaml
resilience4j.circuitbreaker.instances.bookingService:
  slidingWindowSize: 100
  failureRateThreshold: 50
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 10
```

---

## 11. Security at scale

- **Argon2id** cho password hash (đã có) — slower than bcrypt nhưng GPU-resistant.
- **Refresh token rotation** với detection: nếu old refresh token được dùng lại sau khi rotate → flag account compromise, force logout all sessions.
- **JWT short-lived** (15 min access, 30 day refresh).
- **2FA TOTP** — đã có trong auth-service.
- **Audit log immutable** — append-only, sang ClickHouse để retention 7 năm (compliance).

---

## 12. Backup & disaster recovery

- **Postgres**: WAL streaming → S3 (1 hour RPO), daily snapshot (24h RPO).
- **ClickHouse**: replica + backup snapshot weekly.
- **Kafka**: 3-broker replication, retention 7 ngày.
- **Redis**: AOF + RDB snapshots; ephemeral nhưng restart từ Postgres OK.
- **DR drill** quarterly: restore từ backup, verify data integrity.

---

## Roadmap thực thi

**Round 7 (this session — quick wins):**
1. ✅ Permission cache (Caffeine L1) trong auth-service
2. ✅ Pagination cap audit + missing indexes
3. ✅ Rate limiter (Bucket4j) cho write endpoints
4. ✅ docs/scaling.md (this file)

**Round 8 (Q3):**
- Materialized views cho daily revenue + top services
- Structured logging với MDC tenant correlation
- Outbox pattern verification + Debezium CDC test
- Kafka outbox poller for booking → notification fan-out

**Round 9 (Q4):**
- Asset upload pipeline (S3 + image resize worker)
- ClickHouse ETL via CDC + analytics-service HTTP layer
- Distributed tracing với OpenTelemetry
- Per-tenant connection pool tracking

**Round 10+ (FY27):**
- Read replica routing
- Schema-per-tenant for top 10
- Per-tier rate limiting + bulkhead
- DR drill automation
- Cardinality scrubbing for Prometheus

---

**Why:** Bigdata không phải fix ở 1 chỗ — phải treat như 10 layers đa tầng. Tài liệu này là single source of truth để team biết "vấn đề X đã fix chưa, nếu chưa thì roadmap nào".

**How to apply:** Khi user/team nhắc tới scaling, performance, "sao chậm thế?", "khi 1M user thì sao" — đọc file này. Cập nhật trạng thái khi mỗi round implement xong.
