-- Maps each service code to the products it consumes. Used by the
-- BookingCompletedConsumer to write negative inventory_moves when a booking
-- transitions to status='done'.
--
-- service_code is just a string here so this service does not need to share
-- a database with catalog-service. catalog-service publishes service.created
-- events; an admin can also seed manually via /v1/inventory/consumables.

SET search_path TO inventory;

CREATE TABLE service_consumables (
    service_code   VARCHAR(32) NOT NULL,
    product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty_per_use    NUMERIC(10,3) NOT NULL CHECK (qty_per_use > 0),
    notes          TEXT,
    PRIMARY KEY (service_code, product_id)
);
CREATE INDEX idx_service_consumables_code ON service_consumables(service_code);

COMMENT ON TABLE service_consumables IS
    'Per-service consumable mapping. BookingCompletedConsumer reads this to compute deductions.';
