-- Staff leave / time-off requests.
--
-- Workflow:
--   1. Staff submits via /v1/leave (status = pending).
--   2. Manager approves or rejects via /v1/leave/{id}/decide.
--   3. On approval, a trigger writes NGHI shifts into staff_shifts for the
--      affected day(s) — keeps booking conflict checks simple.
--
-- Categories: annual / sick / personal / other.

SET search_path TO booking;

CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    branch_id       UUID NOT NULL,
    staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    category        VARCHAR(16) NOT NULL CHECK (category IN ('annual','sick','personal','other')),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reason          TEXT,
    status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','approved','rejected','cancelled')),
    decided_by      UUID,
    decided_at      TIMESTAMPTZ,
    decision_note   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_leave_range CHECK (end_date >= start_date)
);
CREATE INDEX idx_leave_branch_status ON leave_requests(branch_id, status);
CREATE INDEX idx_leave_staff ON leave_requests(staff_id, start_date DESC);

-- On approval, materialise NGHI shifts for each day in the range.
CREATE OR REPLACE FUNCTION on_leave_approved() RETURNS trigger AS $$
DECLARE
    d DATE;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
        FOR d IN SELECT generate_series(NEW.start_date, NEW.end_date, INTERVAL '1 day')::date LOOP
            INSERT INTO booking.staff_shifts
                (tenant_id, branch_id, staff_id, work_date, shift_type, is_off,
                 start_time, end_time, note)
            VALUES (NEW.tenant_id, NEW.branch_id, NEW.staff_id, d,
                    'NGHI', TRUE, '00:00', '23:59', 'Leave: ' || NEW.category)
            ON CONFLICT (staff_id, work_date) DO UPDATE
                SET shift_type = 'NGHI',
                    is_off = TRUE,
                    note = EXCLUDED.note;
        END LOOP;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leave_approved
AFTER INSERT OR UPDATE OF status ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION on_leave_approved();
