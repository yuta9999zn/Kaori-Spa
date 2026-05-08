-- Customer (CRM) schema.
--
-- Decisions:
--   * Phone is the natural key in Vietnam — unique per (org, phone).
--   * Health notes split out (multiple notes per customer, severity).
--   * Loyalty as a transaction log; current points = sum.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE SCHEMA IF NOT EXISTS customer;
SET search_path TO customer;

CREATE TABLE customers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    org_id       UUID NOT NULL,
    code         VARCHAR(32) NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    phone        VARCHAR(32) NOT NULL,
    email        VARCHAR(255),
    gender       VARCHAR(16),
    dob          DATE,
    locale       VARCHAR(8) NOT NULL DEFAULT 'vi',
    segment      VARCHAR(16) NOT NULL DEFAULT 'new'
                    CHECK (segment IN ('new','regular','vip','dormant')),
    points       INT NOT NULL DEFAULT 0,
    notes        TEXT,
    source       VARCHAR(32),
    consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX uniq_customers_org_code ON customers(org_id, code);
CREATE UNIQUE INDEX uniq_customers_org_phone ON customers(org_id, phone)
    WHERE deleted_at IS NULL;
-- Trigram index on (unaccent(full_name) || phone) for fast typo-tolerant search.
CREATE INDEX idx_customers_search ON customers
    USING gin ((unaccent(lower(full_name)) || ' ' || phone) gin_trgm_ops);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE customer_health_notes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note         TEXT NOT NULL,
    severity     VARCHAR(16) NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info','warn','danger')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by   UUID
);
CREATE INDEX idx_health_customer ON customer_health_notes(customer_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE loyalty_transactions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    delta        INT NOT NULL,
    reason       VARCHAR(255) NOT NULL,
    ref_type     VARCHAR(32),
    ref_id       UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_customer ON loyalty_transactions(customer_id, created_at DESC);
