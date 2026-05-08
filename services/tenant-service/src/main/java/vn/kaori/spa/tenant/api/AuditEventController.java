package vn.kaori.spa.tenant.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.security.TenantContext;
import vn.kaori.spa.tenant.audit.AuditEvent;
import vn.kaori.spa.tenant.audit.AuditEventRepository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Read-only access to mirrored audit events. Writes happen inside
 * {@link vn.kaori.spa.shared.audit.AuditAspect} as a best-effort dual-write
 * alongside Kafka. Tenant scoping:
 * <ul>
 *   <li>{@code TENANT_OWNER} / {@code SUPER_ADMIN} — may pass any
 *       {@code tenantId} (or omit it to query across all tenants).</li>
 *   <li>{@code ORG_OWNER} — forced to caller's
 *       {@link TenantContext#requireTenantId()}; any client-supplied
 *       {@code tenantId} is ignored.</li>
 * </ul>
 */
@RestController
@RequestMapping("/v1/audit-events")
@RequiredArgsConstructor
public class AuditEventController {

    private final AuditEventRepository repo;

    public record AuditEventDto(
            UUID id,
            Instant ts,
            UUID tenantId,
            UUID actorId,
            // TODO: cross-service join with auth-service to resolve actor display name.
            // For now FE renders "—" when null.
            String actorName,
            String action,
            String entityType,
            String entityId,
            String ip,
            String userAgent,
            Map<String, Object> payload
    ) {}

    public record PagedResult<T>(List<T> items, long total, int page, int size) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER','SUPER_ADMIN')")
    public ApiResponse<PagedResult<AuditEventDto>> list(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID effectiveTenantId = resolveTenantScope(tenantId);

        String actionFilter = (action == null || action.isBlank()) ? null : action.trim();
        String entityTypeFilter = (entityType == null || entityType.isBlank()) ? null : entityType.trim();

        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);

        Page<AuditEvent> result = repo.search(
                effectiveTenantId,
                actorId,
                actionFilter,
                entityTypeFilter,
                from,
                to,
                PageRequest.of(safePage, safeSize)
        );

        List<AuditEventDto> items = result.getContent().stream().map(this::toDto).toList();
        return ApiResponse.ok(new PagedResult<>(items, result.getTotalElements(), safePage, safeSize));
    }

    /**
     * If the caller is TENANT_OWNER (or SUPER_ADMIN) they may filter by any
     * tenant or none. Any other role (ORG_OWNER and friends) is hard-scoped
     * to their own tenant — we ignore the {@code tenantId} query param to
     * prevent cross-tenant peeking.
     */
    private UUID resolveTenantScope(UUID requestedTenantId) {
        TenantContext.Principal p = TenantContext.get();
        boolean isPlatformWide = p != null && p.roles() != null
                && (p.roles().contains("TENANT_OWNER")
                || p.roles().contains("ROLE_TENANT_OWNER")
                || p.roles().contains("SUPER_ADMIN")
                || p.roles().contains("ROLE_SUPER_ADMIN"));
        if (isPlatformWide) {
            return requestedTenantId;
        }
        return TenantContext.requireTenantId();
    }

    private AuditEventDto toDto(AuditEvent e) {
        return new AuditEventDto(
                e.getId(),
                e.getTs(),
                e.getTenantId(),
                e.getActorId(),
                null, // actorName — see TODO above.
                e.getAction(),
                e.getEntityType(),
                e.getEntityId(),
                e.getIp(),
                e.getUserAgent(),
                e.getPayload()
        );
    }
}
