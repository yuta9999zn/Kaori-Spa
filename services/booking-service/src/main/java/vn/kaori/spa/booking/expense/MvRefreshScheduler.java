package vn.kaori.spa.booking.expense;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Hourly refresh of the report materialized views created in V22.
 *
 * <p>Uses {@code REFRESH MATERIALIZED VIEW CONCURRENTLY} so report endpoints
 * keep reading the previous snapshot during the rebuild — no lock, no stalled
 * requests. CONCURRENTLY requires a UNIQUE index on each MV; V22 creates
 * those.
 *
 * <p>Failures are logged but never thrown — a stale MV is preferable to a
 * crashed scheduler.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MvRefreshScheduler {

    private final JdbcTemplate jdbc;

    /** 5 minutes past every hour, server time. */
    @Scheduled(cron = "0 5 * * * *")
    public void refresh() {
        long t0 = System.currentTimeMillis();
        try {
            jdbc.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY booking.report_daily_revenue_mv");
            jdbc.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY booking.report_top_services_mv");
            log.info("Report MVs refreshed in {}ms", System.currentTimeMillis() - t0);
        } catch (Exception e) {
            log.error("Report MV refresh failed", e);
        }
    }
}
