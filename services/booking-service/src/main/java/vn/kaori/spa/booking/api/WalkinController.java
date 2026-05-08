package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Walk-in queue. The receptionist hits the kiosk on a tablet at the front
 * desk to add walk-ins; they get a queue number; the system recommends an
 * available bed and qualified staff (via existing AvailabilityController).
 */
@RestController
@RequestMapping("/v1/walkins")
@RequiredArgsConstructor
public class WalkinController {

    @PersistenceContext
    private EntityManager em;

    public record WalkinDto(UUID id, int queueNo, String customerName, String customerPhone,
                            String requestedServiceCode, int estimatedMin, String status,
                            Instant arrivedAt, Instant seatedAt, UUID bookingId) {}

    public record AddReq(@NotNull UUID tenantId, @NotNull UUID branchId,
                         @NotBlank String customerName, String customerPhone,
                         String requestedServiceCode, Integer estimatedMin, String note) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<WalkinDto>> list(@RequestParam UUID branchId,
                                             @RequestParam(defaultValue = "waiting") String status) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, queue_no, customer_name, customer_phone, requested_service_code,
                   estimated_min, status, arrived_at, seated_at, booking_id
            FROM booking.walkin_queue
            WHERE branch_id = :bid
              AND ( :status = '*' OR status = :status )
            ORDER BY
              CASE WHEN status = 'waiting' THEN 0
                   WHEN status = 'seated'  THEN 1
                   ELSE 2 END,
              arrived_at ASC
            LIMIT 100
            """)
            .setParameter("bid", branchId)
            .setParameter("status", status)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new WalkinDto(
                (UUID) r[0],
                ((Number) r[1]).intValue(),
                (String) r[2], (String) r[3], (String) r[4],
                ((Number) r[5]).intValue(),
                (String) r[6],
                ((java.sql.Timestamp) r[7]).toInstant(),
                r[8] == null ? null : ((java.sql.Timestamp) r[8]).toInstant(),
                (UUID) r[9]
        )).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST')")
    @Audited(action = "walkin.add", entityType = "walkin", entityIdExpression = "#req.customerName")
    @Transactional
    public ApiResponse<WalkinDto> add(@Valid @RequestBody AddReq req) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("""
            INSERT INTO booking.walkin_queue
              (id, tenant_id, branch_id, queue_no, customer_name, customer_phone,
               requested_service_code, estimated_min, note)
            VALUES (:id, :tid, :bid, NULL, :name, :phone, :svc, :est, :note)
            """)
            .setParameter("id", id)
            .setParameter("tid", req.tenantId())
            .setParameter("bid", req.branchId())
            .setParameter("name", req.customerName())
            .setParameter("phone", req.customerPhone())
            .setParameter("svc", req.requestedServiceCode())
            .setParameter("est", req.estimatedMin() == null ? 30 : req.estimatedMin())
            .setParameter("note", req.note())
            .executeUpdate();

        var row = em.createNativeQuery("""
            SELECT queue_no, arrived_at FROM booking.walkin_queue WHERE id = :id
            """).setParameter("id", id).getSingleResult();
        Object[] r = (Object[]) row;
        return ApiResponse.ok(new WalkinDto(id,
                ((Number) r[0]).intValue(),
                req.customerName(), req.customerPhone(), req.requestedServiceCode(),
                req.estimatedMin() == null ? 30 : req.estimatedMin(),
                "waiting",
                ((java.sql.Timestamp) r[1]).toInstant(),
                null, null));
    }

    public record SeatReq(@NotNull UUID bookingId) {}

    @PostMapping("/{id}/seat")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST')")
    @Audited(action = "walkin.seat", entityType = "walkin", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> seat(@PathVariable UUID id, @Valid @RequestBody SeatReq req) {
        em.createNativeQuery("""
            UPDATE booking.walkin_queue
            SET status = 'seated', booking_id = :bk, seated_at = now()
            WHERE id = :id AND status = 'waiting'
            """)
            .setParameter("bk", req.bookingId())
            .setParameter("id", id)
            .executeUpdate();
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/left")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST')")
    @Audited(action = "walkin.left", entityType = "walkin", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> left(@PathVariable UUID id) {
        em.createNativeQuery("""
            UPDATE booking.walkin_queue
            SET status = 'left', left_at = now()
            WHERE id = :id AND status = 'waiting'
            """)
            .setParameter("id", id)
            .executeUpdate();
        return ApiResponse.ok(null);
    }
}
