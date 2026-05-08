-- ReminderScheduler reads bookings.customer_locale to choose the SMS template
-- locale (vi/en/ja/zh/ko). Default to 'vi' so existing rows behave unchanged.

ALTER TABLE booking.bookings
    ADD COLUMN IF NOT EXISTS customer_locale VARCHAR(8) NOT NULL DEFAULT 'vi';

CREATE INDEX IF NOT EXISTS idx_bookings_customer_locale
    ON booking.bookings(customer_locale)
    WHERE customer_locale <> 'vi';

COMMENT ON COLUMN booking.bookings.customer_locale IS
    'Preferred locale for outbound SMS / email — falls back to vi → en chain in TemplateRenderer.';
