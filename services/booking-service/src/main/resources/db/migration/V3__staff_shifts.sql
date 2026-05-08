-- Staff shifts — required to validate that a booking can be assigned to
-- a staff member only when they are on shift covering the requested window.
--
-- Design:
--   * Each shift represents a single working window for one staff on one
--     calendar day. Multiple shifts per day are allowed (split shift).
--   * `is_off` rows mark days/windows when the staff is NOT working
--     (vacation, sick leave). When a query looks for "is on shift", we
--     check active windows and ensure no off window overlaps.
--
-- Conflict prevention with bookings happens at the application layer
-- (BookingService.preCheck) — DB cannot easily express "must be inside
-- a shift" without joins.

SET search_path TO booking;

CREATE TABLE staff_shifts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    branch_id   UUID NOT NULL,
    staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    work_date   DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    is_off      BOOLEAN NOT NULL DEFAULT FALSE,
    note        VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_shift_time CHECK (end_time > start_time)
);
CREATE INDEX idx_shifts_staff_date ON staff_shifts(staff_id, work_date);
CREATE INDEX idx_shifts_branch_date ON staff_shifts(branch_id, work_date);

-- ────────────────────────────────────────────────────────────────────────
-- Seed dev shifts: every staff in branch works Mon-Sat 09:00-20:00, off Sun.
-- Production: managers configure via admin UI.

DO $$
DECLARE
    s RECORD;
    d DATE;
BEGIN
    FOR s IN SELECT id, tenant_id, branch_id FROM staff WHERE is_active = TRUE LOOP
        FOR d IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', INTERVAL '1 day')::date LOOP
            IF EXTRACT(DOW FROM d) = 0 THEN
                INSERT INTO staff_shifts (tenant_id, branch_id, staff_id, work_date, start_time, end_time, is_off, note)
                VALUES (s.tenant_id, s.branch_id, s.id, d, '00:00', '23:59', TRUE, 'Day off (Sunday)');
            ELSE
                INSERT INTO staff_shifts (tenant_id, branch_id, staff_id, work_date, start_time, end_time, is_off)
                VALUES (s.tenant_id, s.branch_id, s.id, d, '09:00', '20:00', FALSE);
            END IF;
        END LOOP;
    END LOOP;
END $$;
