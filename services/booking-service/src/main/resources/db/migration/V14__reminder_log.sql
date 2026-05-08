-- Audit table to ensure each (booking, kind) reminder is sent at most once.
-- Kinds: 'confirmation' (immediate), 'h24' (24h before), 'h1' (1h before).
-- The scheduler reads from booking.bookings and writes here on success.

CREATE TABLE IF NOT EXISTS booking.reminder_log (
    booking_id   UUID        NOT NULL,
    kind         TEXT        NOT NULL,
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    channel      TEXT        NOT NULL DEFAULT 'sms',
    PRIMARY KEY (booking_id, kind),
    CONSTRAINT reminder_log_kind_chk CHECK (kind IN ('confirmation','h24','h1'))
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_sent_at ON booking.reminder_log(sent_at DESC);

-- Helper view: bookings due for each reminder window, with deduped log filter
-- and last-minute lead-time guard.
--
-- A booking gets:
--   * 'confirmation' immediately on creation if start_at - created_at < 25h
--     (because the 24h reminder window has already passed at insert time).
--   * 'h24' if start_at is within [now, now + 25h] AND start_at - created_at >= 24h
--     AND start_at > now + 23h  -- only if window hasn't passed yet.
--   * 'h1'  if start_at is within [now, now + 75min].
COMMENT ON TABLE booking.reminder_log IS
    'Idempotency table for outbound reminder SMS — one row per (booking_id, kind).';
