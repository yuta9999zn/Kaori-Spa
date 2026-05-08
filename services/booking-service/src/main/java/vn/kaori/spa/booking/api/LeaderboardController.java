package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Branch + staff leaderboards. Reads from analytics materialized views
 * (V17 migration) and refreshes them every 15 minutes.
 *
 * Default ordering: composite score (revenue + rating + retention).
 * Caller can override with ?orderBy=revenue|rating|bookings.
 */
@RestController
@RequestMapping("/v1/leaderboard")
@RequiredArgsConstructor
@Slf4j
public class LeaderboardController {

    @PersistenceContext
    private EntityManager em;

    public record BranchRow(UUID branchId, long bookingsDone, long bookingsNoshow,
                            long uniqueCustomers, BigDecimal revenue,
                            BigDecimal avgRating, long ratingCount,
                            BigDecimal repeatPct, BigDecimal score) {}

    public record StaffRow(UUID staffId, String staffName, String staffNickname,
                           UUID branchId,
                           long bookingsDone, long bookingsNoshow, long uniqueCustomers,
                           BigDecimal avgRating, long ratingCount, BigDecimal onTimePct,
                           BigDecimal score) {}

    @GetMapping("/branches")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','SUPER_ADMIN')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<BranchRow>> branches(@RequestParam UUID tenantId,
                                                 @RequestParam(defaultValue = "score") String orderBy,
                                                 @RequestParam(defaultValue = "20") int limit) {
        String order = switch (orderBy) {
            case "revenue"  -> "revenue DESC";
            case "rating"   -> "avg_rating DESC, rating_count DESC";
            case "bookings" -> "bookings_done DESC";
            default         -> "score DESC";
        };
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT branch_id, bookings_done, bookings_noshow, unique_customers,
                   revenue, avg_rating, rating_count, repeat_pct, score
            FROM analytics.branch_leaderboard_30d
            WHERE tenant_id = :tid
            ORDER BY """ + order + """

            LIMIT :lim
            """)
            .setParameter("tid", tenantId)
            .setParameter("lim", Math.min(limit, 100))
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new BranchRow(
                (UUID) r[0],
                ((Number) r[1]).longValue(),
                ((Number) r[2]).longValue(),
                ((Number) r[3]).longValue(),
                (BigDecimal) r[4], (BigDecimal) r[5],
                ((Number) r[6]).longValue(),
                (BigDecimal) r[7], (BigDecimal) r[8]
        )).toList());
    }

    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','SUPER_ADMIN')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<StaffRow>> staff(@RequestParam UUID tenantId,
                                             @RequestParam(required = false) UUID branchId,
                                             @RequestParam(defaultValue = "score") String orderBy,
                                             @RequestParam(defaultValue = "30") int limit) {
        String order = switch (orderBy) {
            case "rating"   -> "avg_rating DESC, rating_count DESC";
            case "bookings" -> "bookings_done DESC";
            case "ontime"   -> "on_time_pct DESC, bookings_done DESC";
            default         -> "score DESC";
        };
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT staff_id, staff_name, staff_nickname, branch_id,
                   bookings_done, bookings_noshow, unique_customers,
                   avg_rating, rating_count, on_time_pct, score
            FROM analytics.staff_leaderboard_30d
            WHERE tenant_id = :tid
              AND (:bid IS NULL OR branch_id = :bid)
            ORDER BY """ + order + """

            LIMIT :lim
            """)
            .setParameter("tid", tenantId)
            .setParameter("bid", branchId)
            .setParameter("lim", Math.min(limit, 200))
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new StaffRow(
                (UUID) r[0], (String) r[1], (String) r[2], (UUID) r[3],
                ((Number) r[4]).longValue(),
                ((Number) r[5]).longValue(),
                ((Number) r[6]).longValue(),
                (BigDecimal) r[7],
                ((Number) r[8]).longValue(),
                (BigDecimal) r[9], (BigDecimal) r[10]
        )).toList());
    }

    /** Refresh both materialized views every 15 minutes. CONCURRENTLY so we
     *  don't block reads — requires the unique index defined in V17. */
    @Scheduled(fixedDelayString = "${kaori.leaderboard.refresh-ms:900000}",
               initialDelay = 60_000)
    @Transactional
    public void refresh() {
        try {
            em.createNativeQuery("REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.branch_leaderboard_30d")
              .executeUpdate();
            em.createNativeQuery("REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.staff_leaderboard_30d")
              .executeUpdate();
        } catch (Exception ex) {
            log.warn("Leaderboard refresh failed (likely first-run, no data yet): {}", ex.getMessage());
        }
    }
}
