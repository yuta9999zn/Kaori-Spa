-- The booking_status_logs table already exists (V1). This migration adds
-- a trigger so every status transition is recorded automatically — even
-- when a developer/admin changes status via raw SQL or migration.
--
-- Pattern: AFTER UPDATE OF status ON bookings.

SET search_path TO booking;

CREATE OR REPLACE FUNCTION log_booking_status_change() RETURNS trigger AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO booking.booking_status_logs (
            booking_id, from_status, to_status, by_user, note
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.cancelled_by, NEW.created_by),
            CASE
              WHEN NEW.status = 'cancelled' THEN COALESCE(NEW.cancel_reason, 'cancelled')
              WHEN NEW.status = 'done'      THEN 'completed'
              ELSE NULL
            END
        );
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_status_log ON bookings;
CREATE TRIGGER trg_booking_status_log
AFTER UPDATE OF status ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_booking_status_change();
