-- Cleanup buffer between bookings on the same bed.
--
-- Why: after a service finishes, the bed needs time for sanitisation —
-- in practice 10-30 minutes depending on the procedure.
--
-- Implementation:
--   1. Add `cleanup_min_after` to the room (defaults 15 min for laser
--      rooms, 5 min for standard).
--   2. Use a generated `effective_window` tstzrange that extends each
--      booking_item by the room's buffer.
--   3. Update the EXCLUDE constraint to use this wider range so two
--      bookings cannot land within the buffer either.

SET search_path TO booking;

ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS cleanup_min_after INT NOT NULL DEFAULT 5;

-- Tune for the existing seeded rooms — laser rooms need more cleanup.
UPDATE rooms SET cleanup_min_after = 15 WHERE room_type = 'laser';
UPDATE rooms SET cleanup_min_after = 10 WHERE room_type = 'vip';

-- Drop the existing exclusion (it doesn't know about the buffer).
ALTER TABLE booking_items
    DROP CONSTRAINT IF EXISTS excl_bed_no_overlap;

-- Recreate with a function-call expression that pulls the room's buffer.
-- Using a STABLE function is acceptable for EXCLUDE.
CREATE OR REPLACE FUNCTION effective_window(p_room_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS TSTZRANGE AS $$
    SELECT tstzrange(
        p_start,
        p_end + (COALESCE(
            (SELECT cleanup_min_after FROM booking.rooms WHERE id = p_room_id),
            5
        ) * INTERVAL '1 minute'),
        '[)'
    );
$$ LANGUAGE SQL STABLE;

ALTER TABLE booking_items
    ADD CONSTRAINT excl_bed_no_overlap
    EXCLUDE USING gist (
        bed_id WITH =,
        effective_window(room_id, start_at, end_at) WITH &&
    )
    WHERE (cancelled_at IS NULL AND status NOT IN ('cancelled', 'no_show'));
