-- Booking service schema.
--
-- KEY DESIGN — overbooking protection lives at the DATABASE LEVEL via
-- PostgreSQL EXCLUDE constraints. The application also pre-checks for a
-- friendlier error, but the DB is the source of truth — even concurrent
-- transactions on different replicas cannot bypass it.
--
-- Two exclusion constraints on `booking_items`:
--   1. No two ACTIVE items may share the same `bed_id` with overlapping time.
--   2. No two ACTIVE items may share the same `staff_id` with overlapping time
--      (when staff is assigned).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE SCHEMA IF NOT EXISTS booking;
SET search_path TO booking;

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    branch_id   UUID NOT NULL,
    code        VARCHAR(64) NOT NULL,
    name        JSONB NOT NULL,
    room_type   VARCHAR(32) NOT NULL DEFAULT 'normal',  -- normal | vip | couple | laser
    floor       INT,
    capacity_beds INT NOT NULL DEFAULT 1,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_rooms_branch_code ON rooms(branch_id, code);
CREATE INDEX idx_rooms_tenant ON rooms(tenant_id);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE beds (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    branch_id    UUID NOT NULL,
    room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    code         VARCHAR(64) NOT NULL,
    name         JSONB NOT NULL,
    bed_type     VARCHAR(32) NOT NULL DEFAULT 'standard',  -- standard | massage | laser | vip
    status       VARCHAR(16) NOT NULL DEFAULT 'active',    -- active | maintenance | retired
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_beds_room_code ON beds(room_id, code);
CREATE INDEX idx_beds_tenant_branch ON beds(tenant_id, branch_id);
CREATE INDEX idx_beds_status ON beds(status) WHERE status = 'active';

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE staff (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    branch_id     UUID NOT NULL,
    user_id       UUID,
    code          VARCHAR(64) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    nickname      VARCHAR(64),
    gender        VARCHAR(16),
    role_in_branch VARCHAR(32) NOT NULL DEFAULT 'THERAPIST',
    avatar_url    TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    hire_date     DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_staff_branch_code ON staff(branch_id, code);
CREATE INDEX idx_staff_tenant_branch ON staff(tenant_id, branch_id);

CREATE TABLE staff_skills (
    staff_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_code  VARCHAR(64) NOT NULL,
    skill_level   INT NOT NULL DEFAULT 1 CHECK (skill_level BETWEEN 1 AND 5),
    PRIMARY KEY (staff_id, service_code)
);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    branch_id       UUID NOT NULL,
    code            VARCHAR(32) NOT NULL,
    customer_id     UUID,
    customer_name   VARCHAR(255) NOT NULL,
    customer_phone  VARCHAR(32) NOT NULL,
    customer_email  VARCHAR(255),
    locale          VARCHAR(8) NOT NULL DEFAULT 'vi',
    status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','confirmed','in_progress','done','cancelled','no_show')),
    source          VARCHAR(16) NOT NULL DEFAULT 'web'
                       CHECK (source IN ('web','walkin','phone','ai','admin','partner')),
    start_at        TIMESTAMPTZ NOT NULL,
    end_at          TIMESTAMPTZ NOT NULL,
    total_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency        CHAR(3) NOT NULL DEFAULT 'VND',
    note            TEXT,
    idempotency_key VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    cancelled_at    TIMESTAMPTZ,
    cancelled_by    UUID,
    cancel_reason   TEXT
);
CREATE UNIQUE INDEX uniq_bookings_tenant_code ON bookings(tenant_id, code);
CREATE UNIQUE INDEX uniq_bookings_idempotency ON bookings(tenant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_bookings_branch_start ON bookings(branch_id, start_at DESC);
CREATE INDEX idx_bookings_customer ON bookings(customer_id, start_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_bookings_status_active ON bookings(branch_id, status)
    WHERE status NOT IN ('cancelled', 'no_show');

-- ────────────────────────────────────────────────────────────────────────
-- Each line item ties one service to one bed (and optionally one staff) for
-- a specific time window. Conflict prevention happens here.
CREATE TABLE booking_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    branch_id     UUID NOT NULL,
    booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_code  VARCHAR(64) NOT NULL,
    service_name  JSONB NOT NULL,
    bed_id        UUID NOT NULL REFERENCES beds(id),
    room_id       UUID NOT NULL REFERENCES rooms(id),
    staff_id      UUID REFERENCES staff(id),
    start_at      TIMESTAMPTZ NOT NULL,
    end_at        TIMESTAMPTZ NOT NULL,
    duration_min  INT NOT NULL CHECK (duration_min > 0),
    price         NUMERIC(15,2) NOT NULL DEFAULT 0,
    -- Mirror of bookings.status so the EXCLUDE constraint can filter.
    -- Trigger keeps this in sync.
    status        VARCHAR(16) NOT NULL DEFAULT 'pending',
    cancelled_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_time_range CHECK (end_at > start_at)
);
CREATE INDEX idx_items_booking ON booking_items(booking_id);
CREATE INDEX idx_items_branch_time ON booking_items(branch_id, start_at);

-- HARD CONSTRAINT: bed cannot be double-booked.
ALTER TABLE booking_items
    ADD CONSTRAINT excl_bed_no_overlap
    EXCLUDE USING gist (
        bed_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    )
    WHERE (cancelled_at IS NULL AND status NOT IN ('cancelled', 'no_show'));

-- HARD CONSTRAINT: staff cannot be double-booked when assigned.
ALTER TABLE booking_items
    ADD CONSTRAINT excl_staff_no_overlap
    EXCLUDE USING gist (
        staff_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    )
    WHERE (
        staff_id IS NOT NULL
        AND cancelled_at IS NULL
        AND status NOT IN ('cancelled', 'no_show')
    );

-- ────────────────────────────────────────────────────────────────────────
-- Outbox table for transactional publish to Kafka.
CREATE TABLE outbox_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    topic        VARCHAR(128) NOT NULL,
    key_value    VARCHAR(128) NOT NULL,
    payload      JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,
    attempts     INT NOT NULL DEFAULT 0,
    last_error   VARCHAR(1024)
);
CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;

-- ────────────────────────────────────────────────────────────────────────
-- Status log for traceability.
CREATE TABLE booking_status_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status VARCHAR(16),
    to_status   VARCHAR(16) NOT NULL,
    by_user     UUID,
    note        TEXT,
    ts          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_logs_booking ON booking_status_logs(booking_id, ts DESC);

-- ────────────────────────────────────────────────────────────────────────
-- Trigger keeps booking_items.status in sync with bookings.status so the
-- exclusion constraint stays accurate without forcing the app to update both.
CREATE OR REPLACE FUNCTION sync_item_status() RETURNS trigger AS $$
BEGIN
    UPDATE booking_items
    SET status = NEW.status,
        cancelled_at = CASE WHEN NEW.status IN ('cancelled', 'no_show') THEN now() ELSE cancelled_at END
    WHERE booking_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_status_sync
AFTER UPDATE OF status ON bookings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_item_status();
