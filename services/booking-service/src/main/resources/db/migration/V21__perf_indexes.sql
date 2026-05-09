-- V21: performance indexes (Round 7 audit).
--
-- Adds indexes for hot query paths that surfaced during the pagination /
-- index audit. All statements are idempotent (`IF NOT EXISTS`) so re-running
-- against a database that already has any of them is a no-op.
--
-- Why each one is here:
--   * bookings (tenant_id, branch_id, start_at DESC) — list endpoint filters
--     by both tenant and branch and sorts by start_at; the existing
--     (branch_id, start_at DESC) index works but a tenant-spanning query
--     (e.g. report rollups in PlatformOverview) hits a sequential scan.
--   * bookings (customer_phone, start_at DESC) — CustomerHistoryController
--     and SearchController both filter on customer_phone for booking history.
--     Today this is a sequential scan over the entire bookings table.
--   * booking_items (staff_id, start_at DESC) — AvailabilityController and
--     leaderboard rollups filter active items by staff over time. The
--     existing (branch_id, start_at) does NOT cover staff_id queries.
--   * staff_shifts (tenant_id, branch_id, work_date) — ShiftController and
--     payroll cross-branch queries. The existing (branch_id, work_date) is
--     sufficient for single-branch but not for tenant-scoped views.

SET search_path TO booking;

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_branch_start
    ON bookings (tenant_id, branch_id, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone
    ON bookings (customer_phone, start_at DESC);

CREATE INDEX IF NOT EXISTS idx_items_staff_time
    ON booking_items (staff_id, start_at DESC)
    WHERE staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shifts_tenant_branch_date
    ON staff_shifts (tenant_id, branch_id, work_date);
