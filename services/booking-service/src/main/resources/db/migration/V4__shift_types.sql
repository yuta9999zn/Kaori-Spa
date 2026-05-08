-- Standardize shift codes to match the customer's real spreadsheet workflow
-- (Shift Management_NB.xlsm). Four shift types are used by Natural Beauty:
--
--   SANG  (sáng / 早番) — 09:00 – 15:00  (early)
--   TOI   (tối  / 遅番) — 15:00 – 21:00  (late)
--   FULL  (full / ロング) — 09:00 – 21:00  (long)
--   NGHI  (nghỉ / 休み) — day off
--
-- The previous V3 migration stored start_time/end_time directly. We keep
-- those columns (legacy) but introduce `shift_type` as the source of truth.
-- A trigger keeps start_time/end_time consistent so the BookingService
-- shift-check still works against legacy queries.

SET search_path TO booking;

ALTER TABLE staff_shifts
    ADD COLUMN IF NOT EXISTS shift_type VARCHAR(8);

CREATE OR REPLACE FUNCTION shift_type_to_window(t VARCHAR)
RETURNS TABLE(s TIME, e TIME, off BOOLEAN) AS $$
BEGIN
    IF t = 'SANG' THEN RETURN QUERY SELECT TIME '09:00', TIME '15:00', FALSE;
    ELSIF t = 'TOI'  THEN RETURN QUERY SELECT TIME '15:00', TIME '21:00', FALSE;
    ELSIF t = 'FULL' THEN RETURN QUERY SELECT TIME '09:00', TIME '21:00', FALSE;
    ELSIF t = 'NGHI' THEN RETURN QUERY SELECT TIME '00:00', TIME '23:59', TRUE;
    ELSE RETURN QUERY SELECT NULL::TIME, NULL::TIME, NULL::BOOLEAN;
    END IF;
END $$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger: when shift_type is set/updated, sync start_time/end_time/is_off.
CREATE OR REPLACE FUNCTION sync_shift_window() RETURNS trigger AS $$
DECLARE
    win RECORD;
BEGIN
    IF NEW.shift_type IS NOT NULL THEN
        SELECT * INTO win FROM shift_type_to_window(NEW.shift_type) LIMIT 1;
        NEW.start_time := win.s;
        NEW.end_time   := win.e;
        NEW.is_off     := win.off;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shift_sync_window
BEFORE INSERT OR UPDATE OF shift_type ON staff_shifts
FOR EACH ROW
EXECUTE FUNCTION sync_shift_window();

-- Backfill existing rows.
UPDATE staff_shifts
SET shift_type = CASE
    WHEN is_off THEN 'NGHI'
    WHEN start_time = TIME '09:00' AND end_time = TIME '15:00' THEN 'SANG'
    WHEN start_time = TIME '15:00' AND end_time = TIME '21:00' THEN 'TOI'
    WHEN start_time = TIME '09:00' AND end_time = TIME '21:00' THEN 'FULL'
    ELSE 'FULL'
END
WHERE shift_type IS NULL;

ALTER TABLE staff_shifts
    ALTER COLUMN shift_type SET NOT NULL,
    ADD CONSTRAINT chk_shift_type CHECK (shift_type IN ('SANG', 'TOI', 'FULL', 'NGHI'));

-- One shift entry per staff per day (current rule). If split shifts are needed
-- later, drop this constraint and aggregate by date in the API.
ALTER TABLE staff_shifts
    ADD CONSTRAINT uniq_staff_day UNIQUE (staff_id, work_date);
