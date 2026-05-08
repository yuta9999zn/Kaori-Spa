-- Add-on tracking on booking items. Each item records selected add-on codes
-- (string array) and the precomputed total — the booking-service writes both
-- at create time.

SET search_path TO booking;

ALTER TABLE booking_items
    ADD COLUMN IF NOT EXISTS add_on_codes  TEXT[]        NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS add_on_total  NUMERIC(15,2) NOT NULL DEFAULT 0;
