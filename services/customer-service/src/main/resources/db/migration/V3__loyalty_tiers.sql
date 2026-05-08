-- Loyalty / membership tiers.
--
-- Earn rule (default): 1 point per 10,000 VND spent on services.
-- Redeem rule (default): 1 point = 1,000 VND off (cap 30% per booking).
-- Tier upgrade: when lifetime_spend crosses tier.threshold, segment flips
-- automatically — a trigger does this so the customer's segment badge
-- always reflects their current tier without an offline batch job.

SET search_path TO customer;

CREATE TABLE loyalty_tiers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    code            VARCHAR(16) NOT NULL,    -- new / regular / vip
    name            JSONB NOT NULL,
    threshold       NUMERIC(15,2) NOT NULL,  -- VND lifetime spend to reach this tier
    earn_per_vnd    NUMERIC(8,4) NOT NULL DEFAULT 0.0001,  -- 1 point / 10,000 VND
    redeem_per_pt   NUMERIC(15,2) NOT NULL DEFAULT 1000,    -- 1 point = 1,000 VND
    redeem_cap_pct  NUMERIC(5,2)  NOT NULL DEFAULT 30,
    color_hex       VARCHAR(7),
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_tier_tenant_code ON loyalty_tiers(tenant_id, code);

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS lifetime_spend NUMERIC(15,2) NOT NULL DEFAULT 0;

-- Auto-tier trigger.
CREATE OR REPLACE FUNCTION tier_for_spend(p_tenant UUID, p_spend NUMERIC) RETURNS VARCHAR AS $$
DECLARE
    found_code VARCHAR;
BEGIN
    SELECT code INTO found_code
    FROM loyalty_tiers
    WHERE tenant_id = p_tenant AND threshold <= p_spend
    ORDER BY threshold DESC
    LIMIT 1;
    RETURN COALESCE(found_code, 'new');
END $$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION sync_segment_from_spend() RETURNS trigger AS $$
BEGIN
    IF NEW.lifetime_spend IS DISTINCT FROM OLD.lifetime_spend THEN
        NEW.segment := tier_for_spend(NEW.tenant_id, NEW.lifetime_spend);
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_tier_sync
BEFORE UPDATE OF lifetime_spend ON customers
FOR EACH ROW
EXECUTE FUNCTION sync_segment_from_spend();

-- Seed default tiers for the Natural Beauty tenant.
DO $$
DECLARE
    nb UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
BEGIN
    INSERT INTO loyalty_tiers (tenant_id, code, name, threshold, earn_per_vnd, redeem_per_pt, redeem_cap_pct, color_hex, sort_order)
    VALUES
        (nb, 'new',     '{"vi":"Khách mới","en":"New"}'::jsonb,                0,         0.0001, 1000, 10, '#3b82f6', 1),
        (nb, 'regular', '{"vi":"Thường xuyên","en":"Regular"}'::jsonb,        3000000,    0.00012, 1000, 20, '#10b981', 2),
        (nb, 'vip',     '{"vi":"VIP","en":"VIP"}'::jsonb,                     20000000,   0.00015, 1500, 30, '#C9A87C', 3),
        (nb, 'dormant', '{"vi":"Lâu chưa quay lại","en":"Dormant"}'::jsonb,   -1,         0.0001, 1000, 10, '#94a3b8', 4)
    ON CONFLICT DO NOTHING;
END $$;
