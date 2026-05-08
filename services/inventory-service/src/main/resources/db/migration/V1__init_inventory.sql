-- Inventory: products + stock movements + per-branch balances.
--
-- Decisions:
--   * `inventory_balances` is a materialized cache of the running sum of
--     moves; updated by trigger on each move so reads are O(1).
--   * `inventory_moves` is append-only — corrections are negative moves,
--     never edits.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS inventory;
SET search_path TO inventory;

CREATE TABLE products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    org_id       UUID NOT NULL,
    code         VARCHAR(64) NOT NULL,
    name         JSONB NOT NULL,
    sku          VARCHAR(64),
    unit         VARCHAR(16) NOT NULL DEFAULT 'pcs',
    base_price   NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency     VARCHAR(3) NOT NULL DEFAULT 'VND',
    category     VARCHAR(64),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_products_org_code ON products(org_id, code);

CREATE TABLE inventory_balances (
    product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id    UUID NOT NULL,
    qty          NUMERIC(15,3) NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (product_id, branch_id)
);

CREATE TABLE inventory_moves (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    branch_id    UUID NOT NULL,
    product_id   UUID NOT NULL REFERENCES products(id),
    delta        NUMERIC(15,3) NOT NULL,                       -- positive=in, negative=out
    move_type    VARCHAR(16) NOT NULL                          -- in, out, adjust, transfer
                    CHECK (move_type IN ('in','out','adjust','transfer')),
    ref_type     VARCHAR(32),                                  -- booking_item, sale, manual
    ref_id       UUID,
    note         TEXT,
    actor_id     UUID,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_moves_branch_time ON inventory_moves(branch_id, occurred_at DESC);
CREATE INDEX idx_moves_product_time ON inventory_moves(product_id, occurred_at DESC);

-- Trigger: keep balances in sync.
CREATE OR REPLACE FUNCTION apply_inventory_move() RETURNS trigger AS $$
BEGIN
    INSERT INTO inventory_balances (product_id, branch_id, qty)
    VALUES (NEW.product_id, NEW.branch_id, NEW.delta)
    ON CONFLICT (product_id, branch_id) DO UPDATE
        SET qty = inventory_balances.qty + EXCLUDED.qty,
            updated_at = now();
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_move
AFTER INSERT ON inventory_moves
FOR EACH ROW EXECUTE FUNCTION apply_inventory_move();
