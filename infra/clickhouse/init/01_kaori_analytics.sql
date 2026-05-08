-- Kaori analytics on ClickHouse.
-- Mounted at /docker-entrypoint-initdb.d/ in the clickhouse container.

CREATE DATABASE IF NOT EXISTS kaori;

-- ───────────────────── facts ─────────────────────
CREATE TABLE IF NOT EXISTS kaori.fact_bookings (
    event_ts        DateTime64(3, 'UTC'),
    tenant_id       UUID,
    branch_id       UUID,
    booking_id      UUID,
    booking_code    LowCardinality(String),
    status          LowCardinality(String),
    source          LowCardinality(String),
    locale          LowCardinality(String),
    customer_phone  String,
    start_at        DateTime64(3, 'UTC'),
    duration_min    UInt16,
    total_amount    Decimal(15, 2)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_ts)
ORDER BY (tenant_id, branch_id, event_ts);

CREATE TABLE IF NOT EXISTS kaori.fact_booking_items (
    event_ts        DateTime64(3, 'UTC'),
    tenant_id       UUID,
    branch_id       UUID,
    booking_id      UUID,
    item_id         UUID,
    service_code    LowCardinality(String),
    bed_id          UUID,
    room_id         UUID,
    staff_id        Nullable(UUID),
    duration_min    UInt16,
    price           Decimal(15, 2),
    status          LowCardinality(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_ts)
ORDER BY (tenant_id, branch_id, service_code, event_ts);

CREATE TABLE IF NOT EXISTS kaori.fact_attendance (
    work_date       Date,
    tenant_id       UUID,
    branch_id       UUID,
    staff_id        UUID,
    shift_type      LowCardinality(String),
    status          LowCardinality(String),
    minutes_worked  UInt16,
    minutes_late    UInt16
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(work_date)
ORDER BY (tenant_id, branch_id, staff_id, work_date);

CREATE TABLE IF NOT EXISTS kaori.fact_audit_events (
    event_ts        DateTime64(3, 'UTC'),
    tenant_id       UUID,
    actor_id        Nullable(UUID),
    action          LowCardinality(String),
    entity_type     LowCardinality(String),
    entity_id       String,
    ip              Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_ts)
ORDER BY (tenant_id, event_ts);

-- ───────────────────── materialized rollups ─────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS kaori.mv_revenue_by_day
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (tenant_id, branch_id, day)
AS
SELECT
    toDate(start_at) AS day,
    tenant_id,
    branch_id,
    count() AS bookings,
    sum(total_amount) AS revenue
FROM kaori.fact_bookings
WHERE status IN ('done', 'in_progress', 'confirmed')
GROUP BY day, tenant_id, branch_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS kaori.mv_top_services
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(day)
ORDER BY (tenant_id, branch_id, service_code, day)
AS
SELECT
    toDate(event_ts) AS day,
    tenant_id,
    branch_id,
    service_code,
    count() AS times,
    sum(price) AS revenue
FROM kaori.fact_booking_items
WHERE status = 'done'
GROUP BY day, tenant_id, branch_id, service_code;
