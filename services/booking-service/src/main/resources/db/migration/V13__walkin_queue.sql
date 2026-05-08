-- Walk-in queue: customer arrives without an appointment, lễ tân ghi vào
-- queue, hệ thống suggest first available bed/staff combo. When seated,
-- a real booking is created for them.
--
-- Status flow:
--   waiting    — in line, not yet seated
--   seated     — assigned a bed + staff, booking row created
--   served     — done (booking → status=done)
--   left       — gave up before being seated

SET search_path TO booking;

CREATE TABLE walkin_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    branch_id       UUID NOT NULL,
    queue_no        INT NOT NULL,                      -- per-branch sequential
    customer_name   VARCHAR(255) NOT NULL,
    customer_phone  VARCHAR(32),
    requested_service_code VARCHAR(64),
    estimated_min   INT NOT NULL DEFAULT 30,
    note            TEXT,
    status          VARCHAR(16) NOT NULL DEFAULT 'waiting'
                       CHECK (status IN ('waiting','seated','served','left')),
    booking_id      UUID,                              -- when seated, links the created booking
    arrived_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    seated_at       TIMESTAMPTZ,
    left_at         TIMESTAMPTZ,
    actor_id        UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_walkin_branch_status ON walkin_queue(branch_id, status, arrived_at);

-- Per-branch sequence counter table (avoids the heavy serial-per-branch route).
CREATE TABLE walkin_queue_seq (
    branch_id   UUID PRIMARY KEY,
    seq_date    DATE NOT NULL,
    last_no     INT  NOT NULL DEFAULT 0
);

-- Trigger: assign queue_no when status = waiting and number not yet set.
CREATE OR REPLACE FUNCTION assign_walkin_no() RETURNS trigger AS $$
DECLARE
    today DATE := (NEW.arrived_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
    next_no INT;
BEGIN
    IF NEW.queue_no IS NULL OR NEW.queue_no = 0 THEN
        INSERT INTO walkin_queue_seq (branch_id, seq_date, last_no)
        VALUES (NEW.branch_id, today, 1)
        ON CONFLICT (branch_id) DO UPDATE
            SET last_no = CASE WHEN walkin_queue_seq.seq_date = EXCLUDED.seq_date
                              THEN walkin_queue_seq.last_no + 1
                              ELSE 1 END,
                seq_date = EXCLUDED.seq_date
        RETURNING last_no INTO next_no;
        NEW.queue_no := next_no;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_walkin_no
BEFORE INSERT ON walkin_queue
FOR EACH ROW
EXECUTE FUNCTION assign_walkin_no();
