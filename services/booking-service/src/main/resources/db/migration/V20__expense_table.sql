-- V20: accounting/expense table.
--
-- Booking-service owns the expense ledger (M2 placeholder until a dedicated
-- accounting service exists). Branch managers record operational expenses
-- (rent, utilities, marketing, supplies, …) which feed the /report P&L.
--
-- All rows are scoped by (tenant_id, branch_id). The category enum is kept
-- as a CHECK constraint so it stays simple to evolve from migrations only.

SET search_path TO booking;

CREATE TABLE expense (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    branch_id    UUID NOT NULL,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    category     VARCHAR(32) NOT NULL CHECK (category IN
                   ('towels','supplies','rent','marketing','other','utilities','salary')),
    amount       NUMERIC(14,2) NOT NULL,
    note         TEXT,
    created_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_tenant_branch_date ON expense (tenant_id, branch_id, occurred_at DESC);
CREATE INDEX idx_expense_category           ON expense (category);

-- ────────────────────────────────────────────────────────────────────────
-- Demo seed: ~1 month of expenses for the seeded Natural Beauty branches.
-- The booking-service does not own a `tenant.branches` table; we resolve
-- branch UUIDs the same way V2 seeded rooms/beds (deterministic UUIDv5).
-- The seed only fires when those branches actually exist in `rooms`
-- (which they do once V2 has run).
DO $$
DECLARE
    nb_tenant   UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    branch_575  UUID := uuid_generate_v5(nb_tenant, 'nb-kim-ma-575');
    branch_625  UUID := uuid_generate_v5(nb_tenant, 'nb-kim-ma-625');
BEGIN
    -- Skip if the seed branches haven't been bootstrapped yet (fresh DB
    -- without V2 seed data, or running booking-service standalone).
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE branch_id IN (branch_575, branch_625)) THEN
        RAISE NOTICE 'V20 seed skipped: Natural Beauty branches not present';
        RETURN;
    END IF;

    INSERT INTO expense (tenant_id, branch_id, occurred_at, category, amount, note)
    SELECT nb_tenant, b.branch_id,
           now() - (s.day || ' days')::interval,
           s.cat,
           s.amount,
           s.cat || ' demo'
    FROM (VALUES (branch_575), (branch_625)) AS b(branch_id)
    CROSS JOIN (VALUES
        (5,  'towels',     1500000),
        (10, 'supplies',   2400000),
        (15, 'rent',      19260000),
        (20, 'marketing',  6420000),
        (25, 'utilities',   800000),
        (28, 'other',      1200000)
    ) AS s(day, cat, amount)
    ON CONFLICT DO NOTHING;
END $$;
