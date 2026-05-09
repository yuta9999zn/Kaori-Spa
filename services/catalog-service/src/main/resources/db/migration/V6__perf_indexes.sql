-- V6: performance indexes (Round 7 audit).
--
-- ServiceController.search filters by org_id + is_active + optional gender /
-- region / combo, and the booking-service / availability paths repeatedly
-- look up active services per org. The existing (org_id, code) UNIQUE index
-- does not help these scans because they don't filter on code.
--
-- A partial index keyed on (org_id) WHERE is_active is small (most rows are
-- active so footprint ≈ table size) but lets the planner avoid scanning the
-- whole table for the common "list active services in this org" query.

SET search_path TO catalog;

CREATE INDEX IF NOT EXISTS idx_services_org_active
    ON services (org_id)
    WHERE is_active = TRUE;
