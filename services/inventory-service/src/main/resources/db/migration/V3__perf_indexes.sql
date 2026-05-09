-- V3: performance indexes (Round 7 audit).
--
-- Two gaps surfaced during the audit:
--
--  * inventory_balances has PK (product_id, branch_id), but the InventoryController
--    /stock endpoint queries by branch_id alone — `findAllByIdBranchId(branchId)`.
--    A leading-column index miss forces a sequential scan once the table grows
--    past a few thousand rows. Add a secondary index on branch_id.
--
--  * products.sku is referenced by the spec as a likely lookup column (POS
--    barcode scans, inventory imports). Today only (org_id, code) is unique.
--    Adding a non-unique index on sku covers the lookup without forcing
--    uniqueness across orgs (same SKU may legitimately appear in two tenants).

SET search_path TO inventory;

CREATE INDEX IF NOT EXISTS idx_balances_branch
    ON inventory_balances (branch_id);

CREATE INDEX IF NOT EXISTS idx_products_sku
    ON products (sku)
    WHERE sku IS NOT NULL;
