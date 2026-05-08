package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Customer rating endpoints — public submit (after booking.completed) +
 * branch admin moderation.
 *
 *   POST /v1/public/reviews     { code, phone, rating, comment }
 *   GET  /v1/branches/{id}/rating-summary
 *   GET  /v1/branches/{id}/reviews?limit=20
 *   POST /v1/reviews/{id}/visibility { visible }    (moderator only)
 */
@RestController
@RequiredArgsConstructor
public class ReviewController {

    @PersistenceContext
    private EntityManager em;

    public record SubmitReq(@NotBlank String code,
                            @NotBlank String phone,
                            @NotNull @Min(1) @Max(5) Integer rating,
                            @Size(max = 1000) String comment) {}

    public record ReviewDto(UUID id, int rating, String comment,
                            String customerName, Instant createdAt) {}

    public record RatingSummary(long total, BigDecimal avgRating,
                                long positive, long negative) {}

    @PostMapping("/v1/public/reviews")
    @Transactional
    public ApiResponse<ReviewDto> submit(@Valid @RequestBody SubmitReq req) {
        // Resolve booking by code + phone (soft auth).
        @SuppressWarnings("unchecked")
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, tenant_id, branch_id, customer_name, customer_phone, status
            FROM booking.bookings
            WHERE upper(code) = upper(:code)
            LIMIT 1
            """)
            .setParameter("code", req.code())
            .getResultList();
        if (rows.isEmpty()) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found");
        }
        Object[] r = rows.get(0);
        UUID bookingId = (UUID) r[0];
        UUID tenantId  = (UUID) r[1];
        UUID branchId  = (UUID) r[2];
        String name    = (String) r[3];
        String phone   = (String) r[4];
        String status  = (String) r[5];

        if (!phone.replaceAll("\\s", "").equals(req.phone().replaceAll("\\s", ""))) {
            throw new AppException(ErrorCodes.PERM_DENIED, HttpStatus.FORBIDDEN, "Phone does not match booking");
        }
        if (!"done".equals(status)) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Reviews are only accepted after the booking is completed");
        }

        UUID id = UUID.randomUUID();
        try {
            em.createNativeQuery("""
                INSERT INTO booking.reviews
                  (id, tenant_id, branch_id, booking_id, customer_phone, customer_name, rating, comment)
                VALUES (:id, :tid, :bid, :bk, :phone, :name, :rating, :comment)
                """)
                .setParameter("id", id)
                .setParameter("tid", tenantId)
                .setParameter("bid", branchId)
                .setParameter("bk", bookingId)
                .setParameter("phone", req.phone())
                .setParameter("name", name)
                .setParameter("rating", req.rating())
                .setParameter("comment", req.comment())
                .executeUpdate();
        } catch (Exception ex) {
            // Likely unique violation: customer already reviewed this booking.
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "You have already reviewed this booking");
        }
        return ApiResponse.ok(new ReviewDto(id, req.rating(), req.comment(), name, Instant.now()));
    }

    @GetMapping("/v1/branches/{branchId}/rating-summary")
    @SuppressWarnings("unchecked")
    public ApiResponse<RatingSummary> summary(@PathVariable UUID branchId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT total, avg_rating, positive, negative
            FROM booking.branch_rating_summary WHERE branch_id = :bid
            """)
            .setParameter("bid", branchId)
            .getResultList();
        if (rows.isEmpty()) {
            return ApiResponse.ok(new RatingSummary(0, BigDecimal.ZERO, 0, 0));
        }
        Object[] r = rows.get(0);
        return ApiResponse.ok(new RatingSummary(
                ((Number) r[0]).longValue(),
                (BigDecimal) r[1],
                ((Number) r[2]).longValue(),
                ((Number) r[3]).longValue()
        ));
    }

    @GetMapping("/v1/branches/{branchId}/reviews")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<ReviewDto>> recent(@PathVariable UUID branchId,
                                               @RequestParam(defaultValue = "20") int limit) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, rating, comment, customer_name, created_at
            FROM booking.reviews
            WHERE branch_id = :bid AND visible = TRUE
            ORDER BY created_at DESC
            LIMIT :lim
            """)
            .setParameter("bid", branchId)
            .setParameter("lim", Math.min(limit, 100))
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new ReviewDto(
                (UUID) r[0],
                ((Number) r[1]).intValue(),
                (String) r[2],
                (String) r[3],
                ((java.sql.Timestamp) r[4]).toInstant()
        )).toList());
    }
}
