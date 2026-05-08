-- RLS for customer PII. Same pattern as booking-service V18.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kaori_app') THEN
        CREATE ROLE kaori_app NOLOGIN NOBYPASSRLS;
    END IF;
END $$;

GRANT USAGE ON SCHEMA customer TO kaori_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA customer TO kaori_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA customer
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kaori_app;

CREATE OR REPLACE FUNCTION customer.current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.tenant_id', TRUE), '')::uuid
$$;

ALTER TABLE customer.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.customers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_customers_tenant_isolation ON customer.customers;
CREATE POLICY p_customers_tenant_isolation ON customer.customers
    USING (tenant_id = customer.current_tenant())
    WITH CHECK (tenant_id = customer.current_tenant());

-- loyalty_history if present in V3
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='customer' AND table_name='loyalty_history') THEN
        EXECUTE 'ALTER TABLE customer.loyalty_history ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE customer.loyalty_history FORCE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS p_loyalty_tenant ON customer.loyalty_history';
        EXECUTE 'CREATE POLICY p_loyalty_tenant ON customer.loyalty_history
                 USING (tenant_id = customer.current_tenant())
                 WITH CHECK (tenant_id = customer.current_tenant())';
    END IF;
END $$;
