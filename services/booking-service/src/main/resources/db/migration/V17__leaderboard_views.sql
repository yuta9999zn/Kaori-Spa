-- Leaderboard materialized views for org-admin dashboards.
-- Refresh cadence: 15 minutes (Spring @Scheduled in LeaderboardRefresher).
-- Window: rolling 30 days from now() — recomputed on every refresh.
--
-- All queries use booking.bookings + booking.transactions + booking.reviews so
-- they live in this service even though the metric naming is "analytics".

CREATE SCHEMA IF NOT EXISTS analytics;

-- ── Branch leaderboard (last 30d) ──────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.branch_leaderboard_30d AS
WITH revenue AS (
    SELECT b.tenant_id, b.branch_id,
           COUNT(*) FILTER (WHERE b.status = 'done')   AS bookings_done,
           COUNT(*) FILTER (WHERE b.status = 'no_show') AS bookings_noshow,
           COUNT(DISTINCT b.customer_phone)             AS unique_customers,
           COALESCE(SUM(t.amount), 0)::numeric(14,0)    AS revenue
    FROM booking.bookings b
    LEFT JOIN booking.transactions t ON t.booking_id = b.id
    WHERE b.start_at >= now() - INTERVAL '30 days'
    GROUP BY b.tenant_id, b.branch_id
),
ratings AS (
    SELECT branch_id, AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*) AS rating_count
    FROM booking.reviews
    WHERE created_at >= now() - INTERVAL '30 days' AND visible = TRUE
    GROUP BY branch_id
),
repeat_rate AS (
    SELECT b.branch_id,
           COUNT(*) FILTER (WHERE c.priors > 0)::numeric
             / NULLIF(COUNT(*), 0)::numeric AS repeat_pct
    FROM booking.bookings b
    LEFT JOIN LATERAL (
        SELECT COUNT(*) AS priors FROM booking.bookings p
        WHERE p.customer_phone = b.customer_phone
          AND p.id <> b.id AND p.start_at < b.start_at
    ) c ON TRUE
    WHERE b.start_at >= now() - INTERVAL '30 days' AND b.status = 'done'
    GROUP BY b.branch_id
)
SELECT
    r.tenant_id,
    r.branch_id,
    r.bookings_done,
    r.bookings_noshow,
    r.unique_customers,
    r.revenue,
    COALESCE(rt.avg_rating, 0.0)              AS avg_rating,
    COALESCE(rt.rating_count, 0)              AS rating_count,
    COALESCE(rp.repeat_pct, 0.0)::numeric(4,3) AS repeat_pct,
    -- Composite score for default ranking. Weights chosen to balance volume
    -- + quality + retention, not to favour the largest branch outright.
    (r.revenue / 1000000.0 * 0.5
     + COALESCE(rt.avg_rating, 0) * 5.0
     + COALESCE(rp.repeat_pct, 0) * 20.0)::numeric(8,2) AS score
FROM revenue r
LEFT JOIN ratings rt ON rt.branch_id = r.branch_id
LEFT JOIN repeat_rate rp ON rp.branch_id = r.branch_id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_branch_lb_30d_branch
    ON analytics.branch_leaderboard_30d(branch_id);

-- ── Staff leaderboard (last 30d) ───────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.staff_leaderboard_30d AS
WITH staff_stats AS (
    SELECT b.tenant_id, b.branch_id, bi.staff_id,
           COUNT(*) FILTER (WHERE b.status = 'done')  AS bookings_done,
           COUNT(*) FILTER (WHERE b.status = 'no_show') AS bookings_noshow,
           COUNT(DISTINCT b.customer_phone)            AS unique_customers
    FROM booking.bookings b
    JOIN booking.booking_items bi ON bi.booking_id = b.id
    WHERE b.start_at >= now() - INTERVAL '30 days'
      AND bi.staff_id IS NOT NULL
    GROUP BY b.tenant_id, b.branch_id, bi.staff_id
),
staff_ratings AS (
    SELECT bi.staff_id, AVG(r.rating)::numeric(3,2) AS avg_rating, COUNT(*) AS rating_count
    FROM booking.reviews r
    JOIN booking.booking_items bi ON bi.booking_id = r.booking_id
    WHERE r.created_at >= now() - INTERVAL '30 days' AND r.visible = TRUE
    GROUP BY bi.staff_id
),
staff_punctual AS (
    -- on-time = actual_in <= expected_start + 5 minutes (when both set).
    -- attendance_records.expected_start is a TIME-of-day, so we compose
    -- a TIMESTAMPTZ on the same work_date for comparison.
    SELECT a.staff_id,
           (COUNT(*) FILTER (
                WHERE a.actual_in IS NOT NULL
                  AND a.expected_start IS NOT NULL
                  AND a.actual_in <= (a.work_date + a.expected_start)::timestamptz + INTERVAL '5 minutes'
            )::numeric
            / NULLIF(COUNT(*), 0)::numeric)::numeric(4,3) AS on_time_pct
    FROM booking.attendance_records a
    WHERE a.work_date >= (now() - INTERVAL '30 days')::date
    GROUP BY a.staff_id
)
SELECT
    s.tenant_id,
    s.branch_id,
    s.staff_id,
    st.full_name           AS staff_name,
    st.nickname            AS staff_nickname,
    s.bookings_done,
    s.bookings_noshow,
    s.unique_customers,
    COALESCE(sr.avg_rating, 0.0)        AS avg_rating,
    COALESCE(sr.rating_count, 0)        AS rating_count,
    COALESCE(sp.on_time_pct, 1.0)::numeric(4,3) AS on_time_pct,
    (s.bookings_done * 1.0
     + COALESCE(sr.avg_rating, 0) * 8.0
     + COALESCE(sp.on_time_pct, 0) * 15.0)::numeric(8,2) AS score
FROM staff_stats s
JOIN booking.staff st ON st.id = s.staff_id
LEFT JOIN staff_ratings sr ON sr.staff_id = s.staff_id
LEFT JOIN staff_punctual sp ON sp.staff_id = s.staff_id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_staff_lb_30d_staff
    ON analytics.staff_leaderboard_30d(staff_id);

COMMENT ON MATERIALIZED VIEW analytics.branch_leaderboard_30d IS
    'Rolling 30-day branch KPIs. Refreshed by LeaderboardRefresher every 15 minutes.';
COMMENT ON MATERIALIZED VIEW analytics.staff_leaderboard_30d IS
    'Rolling 30-day staff KPIs. Refreshed by LeaderboardRefresher every 15 minutes.';
