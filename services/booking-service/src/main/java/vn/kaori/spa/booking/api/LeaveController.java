package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/leave")
@RequiredArgsConstructor
public class LeaveController {

    @PersistenceContext
    private EntityManager em;

    public record LeaveDto(UUID id, UUID staffId, String staffName, String category,
                           LocalDate startDate, LocalDate endDate, String reason,
                           String status, Instant createdAt, Instant decidedAt, String decisionNote) {}

    public record CreateReq(@NotNull UUID tenantId, @NotNull UUID branchId, @NotNull UUID staffId,
                            @NotBlank String category,
                            @NotNull LocalDate startDate, @NotNull LocalDate endDate,
                            String reason) {}

    public record DecideReq(@NotBlank String decision, String note) {}    // approved | rejected

    @GetMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','THERAPIST','RECEPTIONIST')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<LeaveDto>> list(@RequestParam UUID branchId,
                                            @RequestParam(required = false) UUID staffId,
                                            @RequestParam(required = false) String status) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT l.id, l.staff_id, s.full_name, l.category,
                   l.start_date, l.end_date, l.reason, l.status,
                   l.created_at, l.decided_at, l.decision_note
            FROM booking.leave_requests l
            JOIN booking.staff s ON s.id = l.staff_id
            WHERE l.branch_id = :bid
              AND (:staffId IS NULL OR l.staff_id = :staffId)
              AND (:status IS NULL OR l.status = :status)
            ORDER BY l.created_at DESC
            LIMIT 100
            """)
            .setParameter("bid", branchId)
            .setParameter("staffId", staffId)
            .setParameter("status", status)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new LeaveDto(
                (UUID) r[0], (UUID) r[1], (String) r[2], (String) r[3],
                ((java.sql.Date) r[4]).toLocalDate(),
                ((java.sql.Date) r[5]).toLocalDate(),
                (String) r[6], (String) r[7],
                ((java.sql.Timestamp) r[8]).toInstant(),
                r[9] == null ? null : ((java.sql.Timestamp) r[9]).toInstant(),
                (String) r[10]
        )).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('THERAPIST','RECEPTIONIST','BRANCH_MANAGER','ORG_OWNER')")
    @Audited(action = "leave.create", entityType = "leave_request", entityIdExpression = "#req.staffId")
    @Transactional
    public ApiResponse<UUID> create(@Valid @RequestBody CreateReq req) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("""
            INSERT INTO booking.leave_requests
              (id, tenant_id, branch_id, staff_id, category, start_date, end_date, reason)
            VALUES (:id, :tid, :bid, :sid, :cat, :start, :end, :reason)
            """)
            .setParameter("id", id)
            .setParameter("tid", req.tenantId())
            .setParameter("bid", req.branchId())
            .setParameter("sid", req.staffId())
            .setParameter("cat", req.category())
            .setParameter("start", req.startDate())
            .setParameter("end", req.endDate())
            .setParameter("reason", req.reason())
            .executeUpdate();
        return ApiResponse.ok(id);
    }

    @PostMapping("/{id}/decide")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "leave.decide", entityType = "leave_request", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> decide(@PathVariable UUID id, @Valid @RequestBody DecideReq req) {
        if (!"approved".equals(req.decision()) && !"rejected".equals(req.decision())) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "decision must be 'approved' or 'rejected'");
        }
        em.createNativeQuery("""
            UPDATE booking.leave_requests
            SET status = :decision, decided_at = now(), decision_note = :note
            WHERE id = :id AND status = 'pending'
            """)
            .setParameter("decision", req.decision())
            .setParameter("note", req.note())
            .setParameter("id", id)
            .executeUpdate();
        return ApiResponse.ok(null);
    }
}
