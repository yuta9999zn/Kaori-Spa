-- Attendance / chấm công.
--
-- One row per (staff, date). Status is computed by the service when the
-- staff checks in or out, or by a nightly job that finalizes "absent" rows.
--
-- Status set:
--   scheduled  — shift assigned, day not yet started
--   present    — checked in within tolerance window
--   late       — checked in after start_time + grace
--   absent     — past end of shift, never checked in
--   early_out  — checked out before end_time - grace
--   off        — shift_type = NGHI for the day
--   no_shift   — no shift row exists for that day

SET search_path TO booking;

CREATE TABLE attendance_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    branch_id       UUID NOT NULL,
    staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    work_date       DATE NOT NULL,
    shift_id        UUID REFERENCES staff_shifts(id) ON DELETE SET NULL,
    expected_start  TIME,
    expected_end    TIME,
    actual_in       TIMESTAMPTZ,
    actual_out      TIMESTAMPTZ,
    status          VARCHAR(16) NOT NULL DEFAULT 'scheduled'
                       CHECK (status IN ('scheduled','present','late','absent','early_out','off','no_shift')),
    minutes_worked  INT,
    minutes_late    INT,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uniq_attendance_staff_day UNIQUE (staff_id, work_date)
);
CREATE INDEX idx_attendance_branch_date ON attendance_records(branch_id, work_date);
