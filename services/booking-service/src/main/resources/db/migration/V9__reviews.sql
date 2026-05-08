-- Customer reviews per completed booking.
--
-- One review per (customer_phone, booking_id). Anonymous reviews are
-- captured before login (e.g. SMS deep link); they get linked back when
-- the customer signs in via the matching phone.
--
-- Star rating 1-5; comment ≤ 1000 chars; can be moderated (visible flag).

SET search_path TO booking;

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    branch_id       UUID NOT NULL,
    booking_id      UUID NOT NULL,
    customer_phone  VARCHAR(32) NOT NULL,
    customer_name   VARCHAR(255),
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         VARCHAR(1000),
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    invited_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uniq_review_booking_phone UNIQUE (booking_id, customer_phone)
);
CREATE INDEX idx_reviews_branch_visible ON reviews(branch_id, created_at DESC)
    WHERE visible = TRUE;
CREATE INDEX idx_reviews_rating ON reviews(branch_id, rating);

-- Aggregate view for branch ratings dashboard.
CREATE OR REPLACE VIEW branch_rating_summary AS
SELECT branch_id,
       COUNT(*) AS total,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating,
       COUNT(*) FILTER (WHERE rating >= 4) AS positive,
       COUNT(*) FILTER (WHERE rating <= 2) AS negative
FROM reviews
WHERE visible = TRUE
GROUP BY branch_id;
