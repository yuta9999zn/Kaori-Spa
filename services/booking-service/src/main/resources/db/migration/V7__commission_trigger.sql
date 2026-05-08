-- Auto-record a staff_commissions row whenever a booking_item transitions
-- to status='done'. Uses the rate from staff_commission_rates (override) or
-- branch_commission_defaults (fallback). Idempotent — UNIQUE on
-- booking_item_id prevents duplicates if the trigger fires twice.

SET search_path TO booking;

CREATE OR REPLACE FUNCTION record_commission_on_done() RETURNS trigger AS $$
DECLARE
    rate    NUMERIC(5,4);
    amt     NUMERIC(15,2);
BEGIN
    IF (NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done'))
       AND NEW.staff_id IS NOT NULL
       AND NEW.cancelled_at IS NULL THEN

        SELECT COALESCE(scr.rate, bcd.rate, 0.05)
        INTO rate
        FROM staff s
        LEFT JOIN staff_commission_rates scr ON scr.staff_id = s.id
        LEFT JOIN branch_commission_defaults bcd ON bcd.branch_id = s.branch_id
        WHERE s.id = NEW.staff_id;

        amt := ROUND(NEW.price * rate, 0);

        INSERT INTO staff_commissions (
            tenant_id, branch_id, staff_id,
            booking_id, booking_item_id,
            service_code, service_name,
            item_price, rate, commission_amount,
            earned_at
        ) VALUES (
            NEW.tenant_id, NEW.branch_id, NEW.staff_id,
            NEW.booking_id, NEW.id,
            NEW.service_code, NEW.service_name,
            NEW.price, rate, amt,
            COALESCE(NEW.start_at, now())
        )
        ON CONFLICT (booking_item_id) DO NOTHING;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_commission ON booking_items;

CREATE TRIGGER trg_item_commission
AFTER INSERT OR UPDATE OF status ON booking_items
FOR EACH ROW
EXECUTE FUNCTION record_commission_on_done();
