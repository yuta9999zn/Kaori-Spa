package vn.kaori.spa.tenant.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
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
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final JdbcTemplate jdbc;

    public record AuditEventDto(
            UUID id,
            Instant ts,
            UUID tenantId,
            UUID actorId,
            // Resolved via a batched cross-schema lookup against
            // auth.users / auth.user_profiles — see resolveActorNames().
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

        Set<UUID> actorIds = result.getContent().stream()
                .map(AuditEvent::getActorId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> actorNames = resolveActorNames(actorIds);

        List<AuditEventDto> items = result.getContent().stream()
                .map(e -> toDto(e, actorNames.get(e.getActorId())))
                .toList();
        return ApiResponse.ok(new PagedResult<>(items, result.getTotalElements(), safePage, safeSize));
    }

    /**
     * Cross-schema batch lookup: tenant.audit_event references actor by id,
     * but the canonical user record lives in auth.users (+ optional profile).
     * Both schemas live in the same DB so a single LEFT JOIN is enough; we
     * fall through name → email → phone via COALESCE.
     */
    private Map<UUID, String> resolveActorNames(Collection<UUID> actorIds) {
        if (actorIds == null || actorIds.isEmpty()) {
            return Map.of();
        }
        String inClause = actorIds.stream()
                .map(id -> "?")
                .collect(Collectors.joining(","));
        String sql = "SELECT u.id, COALESCE(p.full_name, u.email, u.phone) AS actor_name " +
                "FROM auth.users u " +
                "LEFT JOIN auth.user_profiles p ON p.user_id = u.id " +
                "WHERE u.id IN (" + inClause + ")";
        Map<UUID, String> out = new HashMap<>();
        jdbc.query(sql, ps -> {
            int i = 1;
            for (UUID id : actorIds) {
                ps.setObject(i++, id);
            }
        }, rs -> {
            UUID id = rs.getObject("id", UUID.class);
            String name = rs.getString("actor_name");
            if (id != null) {
                out.put(id, name);
            }
        });
        return out;
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

    private AuditEventDto toDto(AuditEvent e, String actorName) {
        return new AuditEventDto(
                e.getId(),
                e.getTs(),
                e.getTenantId(),
                e.getActorId(),
                actorName,
                e.getAction(),
                e.getEntityType(),
                e.getEntityId(),
                e.getIp(),
                e.getUserAgent(),
                e.getPayload()
        );
    }
}
