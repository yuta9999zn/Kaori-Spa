-- V22: materialized views for hot report endpoints.
--
-- Reports previously aggregated raw `booking.bookings` ⨝ `booking.booking_items`
-- on every request. At scale this scans millions of rows per call. We
-- precompute the two heaviest aggregates and refresh them hourly via
-- MvRefreshScheduler (REFRESH ... CONCURRENTLY — readers are not blocked).
--
-- Trade-off: the reports lag real-time by up to one hour. Acceptable for
-- revenue dashboards. If a "today, live" view is ever needed it should
-- bypass the MV and read the base tables directly.
--
-- The filters here MIRROR the queries in ReportController so the response
-- shape stays identical and FE consumers see no change:
--   * daily-revenue:  status IN ('done','in_progress','confirmed') AND item not cancelled
--   * top-services:   status IN ('done','in_progress')              AND item not cancelled
-- Both bucket on the booking_item start_at (not the booking header) so a
-- multi-service booking spanning a day boundary lands in the right bucket.

SET search_path TO booking;

-- ──────────────────────────────────────────────────────────────────
-- Daily revenue MV — one row per (tenant, branch, day).
CREATE MATERIALIZED VIEW IF NOT EXISTS report_daily_revenue_mv AS
SELECT
    b.tenant_id,
    b.branch_id,
    (i.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
    COUNT(DISTINCT i.booking_id)::BIGINT               AS bookings_count,
    COALESCE(SUM(i.price), 0)::NUMERIC(15,2)           AS revenue,
    COUNT(DISTINCT b.customer_phone)::BIGINT           AS unique_customers
FROM booking.bookings b
JOIN booking.booking_items i ON i.booking_id = b.id
WHERE b.status IN ('done', 'in_progress', 'confirmed')
  AND i.cancelled_at IS NULL
GROUP BY b.tenant_id, b.branch_id, (i.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_report_daily_revenue
    ON report_daily_revenue_mv (tenant_id, branch_id, day);

CREATE INDEX IF NOT EXISTS idx_report_daily_revenue_tenant_day
    ON report_daily_revenue_mv (tenant_id, day);

-- ──────────────────────────────────────────────────────────────────
-- Top services MV — one row per (tenant, branch, service, month).
CREATE MATERIALIZED VIEW IF NOT EXISTS report_top_services_mv AS
SELECT
    b.tenant_id,
    b.branch_id,
    i.service_code,
    DATE_TRUNC('month', i.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS month,
    COUNT(*)::BIGINT                          AS times,
    COALESCE(SUM(i.price), 0)::NUMERIC(15,2)  AS revenue
FROM booking.bookings b
JOIN booking.booking_items i ON i.booking_id = b.id
WHERE b.status IN ('done', 'in_progress')
  AND i.cancelled_at IS NULL
GROUP BY b.tenant_id, b.branch_id, i.service_code,
         DATE_TRUNC('month', i.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_report_top_services
    ON report_top_services_mv (tenant_id, branch_id, service_code, month);

CREATE INDEX IF NOT EXISTS idx_report_top_services_tenant_month
    ON report_top_services_mv (tenant_id, month);

-- ──────────────────────────────────────────────────────────────────
-- Initial population so the first request after deploy hits warm data.
REFRESH MATERIALIZED VIEW report_daily_revenue_mv;
REFRESH MATERIALIZED VIEW report_top_services_mv;
