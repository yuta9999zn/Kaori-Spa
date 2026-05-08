package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Heuristic no-show probability score.
 *
 * Real ML model lives in `analytics-service` (Python). This endpoint gives
 * a fast, explainable score the receptionist can trust without waiting for
 * a model deploy. Inputs:
 *   - booking lead time (very short and very long → higher risk)
 *   - customer history: prior no_show ratio, last visit recency
 *   - segment (dormant > new > regular > vip)
 *   - phone-only contact (no email) → slightly higher risk
 *
 * Range: 0.0 (very unlikely) → 1.0 (very likely no-show).
 */
@RestController
@RequestMapping("/v1/bookings")
@RequiredArgsConstructor
public class NoShowController {

    @PersistenceContext
    private EntityManager em;

    public record Score(double probability, String label, List<String> reasons) {}

    @GetMapping("/{id}/noshow-score")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST','ORG_OWNER','ACCOUNTANT')")
    public ApiResponse<Score> score(@PathVariable UUID id) {
        return ApiResponse.ok(computeScore(id));
    }

    @SuppressWarnings("unchecked")
    Score computeScore(UUID bookingId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT b.start_at, b.created_at, b.customer_phone, b.customer_email, b.source,
                   COALESCE(p.priors_total, 0)   AS priors_total,
                   COALESCE(p.priors_no_show, 0) AS priors_no_show,
                   COALESCE(p.last_visit_days, 999) AS last_visit_days
            FROM booking.bookings b
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS priors_total,
                       COUNT(*) FILTER (WHERE x.status IN ('no_show','cancelled')) AS priors_no_show,
                       EXTRACT(DAY FROM now() - MAX(x.start_at))::int AS last_visit_days
                FROM booking.bookings x
                WHERE x.customer_phone = b.customer_phone
                  AND x.id <> b.id
                  AND x.start_at < b.start_at
            ) p ON TRUE
            WHERE b.id = :id
            LIMIT 1
            """)
            .setParameter("id", bookingId)
            .getResultList();
        if (rows.isEmpty()) return new Score(0.5, "unknown", List.of("Booking not found"));

        Object[] r = rows.get(0);
        Instant startAt   = ((java.sql.Timestamp) r[0]).toInstant();
        Instant createdAt = ((java.sql.Timestamp) r[1]).toInstant();
        String email      = (String) r[3];
        String source     = (String) r[4];
        long priorTotal   = ((Number) r[5]).longValue();
        long priorNoShow  = ((Number) r[6]).longValue();
        long lastVisitDays = ((Number) r[7]).longValue();

        double score = 0.20;   // base prior
        var reasons = new java.util.ArrayList<String>();

        long leadHours = Duration.between(createdAt, startAt).toHours();
        if (leadHours < 2) {
            score += 0.10; reasons.add("Đặt sát giờ (<2h) — lúc đặt và lúc đến gần nhau");
        } else if (leadHours > 24 * 14) {
            score += 0.20; reasons.add("Đặt quá xa (>2 tuần) — khách dễ quên");
        }

        if (priorTotal >= 3) {
            double ratio = priorNoShow / (double) priorTotal;
            if (ratio > 0.3) {
                score += 0.40; reasons.add("Lịch sử bỏ hẹn cao (" + Math.round(ratio * 100) + "%)");
            } else if (ratio > 0.1) {
                score += 0.15; reasons.add("Có vài lần bỏ hẹn trước đây");
            } else {
                score -= 0.10; reasons.add("Khách quen, ít bỏ hẹn");
            }
        } else if (priorTotal == 0) {
            score += 0.10; reasons.add("Khách lần đầu");
        }

        if (lastVisitDays > 180 && priorTotal > 0) {
            score += 0.15; reasons.add("Đã >6 tháng chưa quay lại");
        }

        if (email == null || email.isBlank()) {
            score += 0.05; reasons.add("Không có email — chỉ liên lạc qua SMS");
        }

        if ("walkin".equalsIgnoreCase(source)) {
            score -= 0.20; reasons.add("Walk-in — đã ở tại spa");
        }

        score = Math.max(0.0, Math.min(1.0, score));
        String label =
                score >= 0.65 ? "high" :
                score >= 0.40 ? "medium" : "low";
        return new Score(Math.round(score * 100) / 100.0, label, reasons);
    }
}
