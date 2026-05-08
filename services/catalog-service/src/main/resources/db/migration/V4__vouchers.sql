-- Voucher / promotion codes.
--
-- Two flavours:
--   PERCENT     — 10%, 20%, … off bill (capped optionally)
--   FIXED       — 100,000₫ off
--
-- Constraints:
--   - max_uses            : total redemptions allowed (NULL = unlimited)
--   - max_uses_per_customer : per-phone cap to prevent abuse
--   - valid_from / valid_to : time window
--   - applies_to_services  : optional code list; NULL = all services

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO catalog;

CREATE TABLE vouchers (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                UUID NOT NULL,
    org_id                   UUID NOT NULL,
    code                     VARCHAR(32) NOT NULL,
    kind                     VARCHAR(8) NOT NULL CHECK (kind IN ('PERCENT', 'FIXED')),
    value                    NUMERIC(15, 2) NOT NULL,
    cap_amount               NUMERIC(15, 2),
    valid_from               TIMESTAMPTZ NOT NULL,
    valid_to                 TIMESTAMPTZ NOT NULL,
    max_uses                 INT,
    used_count               INT NOT NULL DEFAULT 0,
    max_uses_per_customer    INT NOT NULL DEFAULT 1,
    min_bill                 NUMERIC(15, 2) NOT NULL DEFAULT 0,
    applies_to_services      TEXT[],
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_voucher_window CHECK (valid_to > valid_from)
);
CREATE UNIQUE INDEX uniq_voucher_org_code ON vouchers(org_id, code);
CREATE INDEX idx_voucher_active ON vouchers(org_id, is_active, valid_to) WHERE is_active = TRUE;

CREATE TABLE voucher_redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id      UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    booking_id      UUID,
    customer_phone  VARCHAR(32) NOT NULL,
    discount_amount NUMERIC(15, 2) NOT NULL,
    bill_amount     NUMERIC(15, 2) NOT NULL,
    redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_redemptions_voucher ON voucher_redemptions(voucher_id);
CREATE INDEX idx_redemptions_phone ON voucher_redemptions(customer_phone);

-- Seed sample vouchers for Natural Beauty.
DO $$
DECLARE
    nb UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    org UUID := uuid_generate_v5(nb, 'org:natural-beauty');
BEGIN
    INSERT INTO vouchers (tenant_id, org_id, code, kind, value, cap_amount,
                          valid_from, valid_to, max_uses, max_uses_per_customer, min_bill)
    VALUES
        (nb, org, 'WELCOME10',  'PERCENT', 10, 200000,  now(), now() + INTERVAL '90 days', 1000, 1, 0),
        (nb, org, 'TET2026',    'PERCENT', 15, 500000,  now(), now() + INTERVAL '30 days', 500, 2, 500000),
        (nb, org, 'VIP100K',    'FIXED',   100000, NULL, now(), now() + INTERVAL '365 days', NULL, 5, 1000000)
    ON CONFLICT DO NOTHING;
END $$;
