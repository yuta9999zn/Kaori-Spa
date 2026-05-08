package vn.kaori.spa.tenant.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    /**
     * All filters are optional except pagination — null arguments fall through.
     * The query is written so the planner can use the
     * (tenant_id, ts DESC) composite index when {@code tenantId} is bound.
     */
    @Query("""
            SELECT e FROM AuditEvent e
            WHERE (:tenantId IS NULL OR e.tenantId = :tenantId)
              AND (:actorId  IS NULL OR e.actorId  = :actorId)
              AND (:action   IS NULL OR LOWER(e.action) LIKE LOWER(CONCAT('%', :action, '%')))
              AND (:entityType IS NULL OR e.entityType = :entityType)
              AND (:from IS NULL OR e.ts >= :from)
              AND (:to   IS NULL OR e.ts <  :to)
            ORDER BY e.ts DESC
            """)
    Page<AuditEvent> search(
            @Param("tenantId") UUID tenantId,
            @Param("actorId") UUID actorId,
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}
