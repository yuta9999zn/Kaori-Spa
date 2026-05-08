-- Point-of-sale / payment receipts.
--
-- Each row = one payment event (full or partial). Multiple transactions may
-- close a single booking (deposit + remainder). When SUM(amount) >=
-- booking.total_amount, the booking is considered fully paid.
--
-- Method codes match the customer's existing accounting categories:
--   tm     — tiền mặt (cash)
--   the    — thẻ tín dụng / debit card (POS terminal)
--   ck-loc — chuyển khoản nội bộ chi nhánh (local bank account)
--   ck-cty — chuyển khoản công ty (company bank account)
--   vi-mom — ví điện tử (Momo, ZaloPay, …)

SET search_path TO booking;

CREATE TABLE payment_methods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(16) NOT NULL,
    name        JSONB NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_payment_methods_tenant_code ON payment_methods(tenant_id, code);

CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    branch_id       UUID NOT NULL,
    txn_type        VARCHAR(8) NOT NULL CHECK (txn_type IN ('dv', 'mp')),    -- service vs product (matches AuraDB seed)
    method_code     VARCHAR(16) NOT NULL,
    amount          NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
    booking_id      UUID,
    customer_phone  VARCHAR(32),
    customer_name   VARCHAR(255),
    note            TEXT,
    actor_id        UUID,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    refunded_at     TIMESTAMPTZ,
    refund_reason   TEXT,
    receipt_no      VARCHAR(32),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_txn_branch_paid ON transactions(branch_id, paid_at DESC);
CREATE INDEX idx_txn_booking ON transactions(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_txn_method_paid ON transactions(method_code, paid_at DESC);

-- ─── Seed Vietnamese-canonical payment methods ──
DO $$
DECLARE
    nb_tenant UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
BEGIN
    INSERT INTO payment_methods (tenant_id, code, name, sort_order) VALUES
        (nb_tenant, 'tm',     '{"vi":"Tiền mặt","en":"Cash","ja":"現金"}'::jsonb,        1),
        (nb_tenant, 'the',    '{"vi":"Thẻ","en":"Card","ja":"カード"}'::jsonb,            2),
        (nb_tenant, 'ck-loc', '{"vi":"CK chi nhánh","en":"Bank (branch)"}'::jsonb,        3),
        (nb_tenant, 'ck-cty', '{"vi":"CK công ty","en":"Bank (company)"}'::jsonb,         4),
        (nb_tenant, 'vi-mom', '{"vi":"Ví điện tử","en":"E-wallet"}'::jsonb,               5)
    ON CONFLICT DO NOTHING;
END $$;
