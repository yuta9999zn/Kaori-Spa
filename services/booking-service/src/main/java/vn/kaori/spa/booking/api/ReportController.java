package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregated reports across one or many branches (used by org-admin).
 *
 * For now we read from Postgres directly. Once the ClickHouse ETL is live
 * (analytics-service) these queries should switch to CH for sub-second
 * response on years of data.
 */
@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    @PersistenceContext
    private EntityManager em;

    public record DailyRevenue(LocalDate day, BigDecimal revenue, long bookings) {}
    public record BranchSummary(UUID branchId, BigDecimal revenue, long bookings,
                                long doneBookings, long cancelled, BigDecimal avgTicket) {}
    public record TopService(String serviceCode, long times, BigDecimal revenue) {}

    @GetMapping("/revenue/daily")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','BRANCH_MANAGER','ACCOUNTANT')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<DailyRevenue>> daily(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        var q = em.createNativeQuery("""
            SELECT (i.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
                   COALESCE(SUM(i.price), 0)                          AS revenue,
                   COUNT(DISTINCT i.booking_id)                       AS bookings
            FROM booking.booking_items i
            JOIN booking.bookings b ON b.id = i.booking_id
            WHERE b.tenant_id = :tenantId
              AND (:branchId IS NULL OR b.branch_id = :branchId)
              AND b.status IN ('done', 'in_progress', 'confirmed')
              AND i.start_at >= :from
              AND i.start_at <  :toExclusive
              AND i.cancelled_at IS NULL
            GROUP BY day
            ORDER BY day
            """)
            .setParameter("tenantId", tenantId)
            .setParameter("branchId", branchId)
            .setParameter("from", from.atStartOfDay())
            .setParameter("toExclusive", to.plusDays(1).atStartOfDay());

        List<Object[]> rows = q.getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new DailyRevenue(
                ((java.sql.Date) r[0]).toLocalDate(),
                (BigDecimal) r[1],
                ((Number) r[2]).longValue()
        )).toList());
    }

    @GetMapping("/revenue/by-branch")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<BranchSummary>> byBranch(
            @RequestParam UUID tenantId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT b.branch_id,
                   COALESCE(SUM(CASE WHEN i.cancelled_at IS NULL AND i.status IN ('done','in_progress','confirmed')
                                     THEN i.price ELSE 0 END), 0) AS revenue,
                   COUNT(DISTINCT b.id)                            AS bookings,
                   COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'done')      AS done_count,
                   COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled,
                   COALESCE(AVG(b.total_amount) FILTER (WHERE b.status = 'done'), 0) AS avg_ticket
            FROM booking.bookings b
            LEFT JOIN booking.booking_items i ON i.booking_id = b.id
            WHERE b.tenant_id = :tenantId
              AND b.start_at >= :from
              AND b.start_at <  :toExclusive
            GROUP BY b.branch_id
            ORDER BY revenue DESC
            """)
            .setParameter("tenantId", tenantId)
            .setParameter("from", from.atStartOfDay())
            .setParameter("toExclusive", to.plusDays(1).atStartOfDay())
            .getResultList();

        return ApiResponse.ok(rows.stream().map(r -> new BranchSummary(
                (UUID) r[0],
                (BigDecimal) r[1],
                ((Number) r[2]).longValue(),
                ((Number) r[3]).longValue(),
                ((Number) r[4]).longValue(),
                (BigDecimal) r[5]
        )).toList());
    }

    @GetMapping("/top-services")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','BRANCH_MANAGER','ACCOUNTANT')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<TopService>> topServices(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        // Cap so a careless caller can't ask for the full service catalog.
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        List<Object[]> rows = em.createNativeQuery("""
            SELECT i.service_code,
                   COUNT(*)                AS times,
                   COALESCE(SUM(i.price),0) AS revenue
            FROM booking.booking_items i
            JOIN booking.bookings b ON b.id = i.booking_id
            WHERE b.tenant_id = :tenantId
              AND (:branchId IS NULL OR b.branch_id = :branchId)
              AND b.status IN ('done', 'in_progress')
              AND i.cancelled_at IS NULL
              AND i.start_at >= :from AND i.start_at < :toExclusive
            GROUP BY i.service_code
            ORDER BY revenue DESC
            LIMIT :lim
            """)
            .setParameter("tenantId", tenantId)
            .setParameter("branchId", branchId)
            .setParameter("from", from.atStartOfDay())
            .setParameter("toExclusive", to.plusDays(1).atStartOfDay())
            .setParameter("lim", safeLimit)
            .getResultList();

        return ApiResponse.ok(rows.stream().map(r -> new TopService(
                (String) r[0],
                ((Number) r[1]).longValue(),
                (BigDecimal) r[2]
        )).toList());
    }

    // ─── Expenses ───────────────────────────────────────────────────────────

    public record ExpenseBreakdownRow(String category, BigDecimal amount, int pct) {}
    public record ExpenseSummaryDto(BigDecimal totalAmount, List<ExpenseBreakdownRow> breakdown) {}

    /**
     * SUM expenses per category for a branch over a date window. {@code pct}
     * is rounded to the nearest percent of {@code totalAmount}. When the
     * window is empty an envelope with {@code totalAmount = 0} and an empty
     * breakdown is returned.
     */
    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    @SuppressWarnings("unchecked")
    public ApiResponse<ExpenseSummaryDto> expenses(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT category,
                   COALESCE(SUM(amount), 0) AS amount
            FROM booking.expense
            WHERE tenant_id = :tenantId
              AND (:branchId IS NULL OR branch_id = :branchId)
              AND occurred_at >= :from
              AND occurred_at <  :toExclusive
            GROUP BY category
            ORDER BY amount DESC
            """)
            .setParameter("tenantId", tenantId)
            .setParameter("branchId", branchId)
            .setParameter("from", from.atStartOfDay())
            .setParameter("toExclusive", to.plusDays(1).atStartOfDay())
            .getResultList();

        BigDecimal total = BigDecimal.ZERO;
        for (Object[] r : rows) total = total.add((BigDecimal) r[1]);

        List<ExpenseBreakdownRow> breakdown = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            BigDecimal amt = (BigDecimal) r[1];
            int pct = total.signum() == 0
                    ? 0
                    : amt.multiply(BigDecimal.valueOf(100))
                         .divide(total, 0, RoundingMode.HALF_UP)
                         .intValue();
            breakdown.add(new ExpenseBreakdownRow((String) r[0], amt, pct));
        }
        return ApiResponse.ok(new ExpenseSummaryDto(total, breakdown));
    }

    // ─── Yearly revenue rollup ──────────────────────────────────────────────

    public record YearlyMonthRow(int month, BigDecimal revenue) {}
    public record YearlyRevenueDto(int year, List<YearlyMonthRow> months) {}

    /**
     * 12-row monthly revenue rollup for the calendar year. Missing months
     * are zero-filled so the FE can render a fixed 12-bar chart.
     */
    @GetMapping("/revenue/yearly")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    @SuppressWarnings("unchecked")
    public ApiResponse<YearlyRevenueDto> yearly(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam int year
    ) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate toExclusive = LocalDate.of(year + 1, 1, 1);

        List<Object[]> rows = em.createNativeQuery("""
            SELECT EXTRACT(MONTH FROM (i.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int AS m,
                   COALESCE(SUM(i.price), 0) AS revenue
            FROM booking.booking_items i
            JOIN booking.bookings b ON b.id = i.booking_id
            WHERE b.tenant_id = :tenantId
              AND (:branchId IS NULL OR b.branch_id = :branchId)
              AND b.status IN ('done', 'in_progress', 'confirmed')
              AND i.cancelled_at IS NULL
              AND i.start_at >= :from
              AND i.start_at <  :toExclusive
            GROUP BY m
            ORDER BY m
            """)
            .setParameter("tenantId", tenantId)
            .setParameter("branchId", branchId)
            .setParameter("from", from.atStartOfDay())
            .setParameter("toExclusive", toExclusive.atStartOfDay())
            .getResultList();

        BigDecimal[] perMonth = new BigDecimal[12];
        for (int i = 0; i < 12; i++) perMonth[i] = BigDecimal.ZERO;
        for (Object[] r : rows) {
            int m = ((Number) r[0]).intValue();
            if (m >= 1 && m <= 12) perMonth[m - 1] = (BigDecimal) r[1];
        }

        List<YearlyMonthRow> months = new ArrayList<>(12);
        for (int i = 0; i < 12; i++) months.add(new YearlyMonthRow(i + 1, perMonth[i]));
        return ApiResponse.ok(new YearlyRevenueDto(year, months));
    }

    /** dow = 0..6 (Mon..Sun), hour = 0..23. */
    public record HeatmapCell(int dow, int hour, long bookings) {}

    /**
     * Booking density per (day-of-week × hour-of-day) over the requested
     * window. Used by the availability heatmap so managers can see which
     * cells of the week are busy / quiet.
     */
    @GetMapping("/heatmap")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','BRANCH_MANAGER','ACCOUNTANT')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<HeatmapCell>> heatmap(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT (EXTRACT(ISODOW FROM (b.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) - 1)::int AS dow,
                   EXTRACT(HOUR FROM (b.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int       AS hour,
                   COUNT(*)                                                                    AS cnt
            FROM booking.bookings b
            WHERE b.tenant_id = :tenantId
              AND (:branchId IS NULL OR b.branch_id = :branchId)
              AND b.status NOT IN ('cancelled', 'no_show')
              AND b.start_at >= :from AND b.start_at < :toExclusive
            GROUP BY dow, hour
            ORDER BY dow, hour
            """)
            .setParameter("tenantId", tenantId)
            .setParameter("branchId", branchId)
            .setParameter("from", from.atStartOfDay())
            .setParameter("toExclusive", to.plusDays(1).atStartOfDay())
            .getResultList();

        return ApiResponse.ok(rows.stream().map(r -> new HeatmapCell(
                ((Number) r[0]).intValue(),
                ((Number) r[1]).intValue(),
                ((Number) r[2]).longValue()
        )).toList());
    }
}
