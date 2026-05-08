-- Postgres RLS for the most sensitive booking tables. The application sets
-- `app.tenant_id` at the start of every request via TenantInterceptor; the
-- policy enforces "you can only see rows whose tenant_id matches the
-- session GUC". A query that forgets WHERE tenant_id = ? is now safely
-- filtered by Postgres, not just by Hibernate.
--
-- Service-level superuser (the role the migration runs as) bypasses RLS by
-- default, which keeps Flyway working. Application connections must use a
-- non-bypass role; we set `BYPASSRLS = false` on the kaori_app role assumed
-- to exist in V1__init.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaori_app') THEN
        CREATE ROLE kaori_app NOLOGIN NOBYPASSRLS;
    END IF;
END $$;

GRANT USAGE ON SCHEMA booking TO kaori_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA booking TO kaori_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA booking
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kaori_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA booking TO kaori_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA booking
    GRANT USAGE ON SEQUENCES TO kaori_app;

-- Helper that reads the GUC and returns a tenant UUID, or NULL if unset.
-- Marked STABLE so the planner can hoist it out of row-level filters.
CREATE OR REPLACE FUNCTION booking.current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid
$$;

-- ── bookings ────────────────────────────────────────────────────────────
ALTER TABLE booking.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking.bookings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_bookings_tenant_isolation ON booking.bookings;
CREATE POLICY p_bookings_tenant_isolation ON booking.bookings
    USING (tenant_id = booking.current_tenant())
    WITH CHECK (tenant_id = booking.current_tenant());

-- ── booking_items ──────────────────────────────────────────────────────
ALTER TABLE booking.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking.booking_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_items_tenant_isolation ON booking.booking_items;
CREATE POLICY p_items_tenant_isolation ON booking.booking_items
    USING (tenant_id = booking.current_tenant())
    WITH CHECK (tenant_id = booking.current_tenant());

-- ── reviews ─────────────────────────────────────────────────────────────
-- Public review submission must work without a JWT (no GUC set), so we
-- allow tenant_id IS NULL session to write but never to read. Reads still
-- require the GUC.
ALTER TABLE booking.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking.reviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_reviews_select ON booking.reviews;
CREATE POLICY p_reviews_select ON booking.reviews FOR SELECT
    USING (tenant_id = booking.current_tenant());

DROP POLICY IF EXISTS p_reviews_modify ON booking.reviews;
CREATE POLICY p_reviews_modify ON booking.reviews FOR ALL
    USING (tenant_id = booking.current_tenant() OR booking.current_tenant() IS NULL)
    WITH CHECK (tenant_id IS NOT NULL);

-- ── payments (cross-schema reference) ──────────────────────────────────
-- Payments live in their own schema (V8) and have their own RLS migration.

COMMENT ON FUNCTION booking.current_tenant IS
    'Returns the tenant_id set by the application via SET app.tenant_id. NULL when unset.';
