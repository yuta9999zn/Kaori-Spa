package vn.kaori.spa.tenant.api;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kaori.spa.shared.api.ApiResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Platform-wide aggregates for the tenant-admin /analytics page. This is
 * cross-tenant data — the controller intentionally has no tenant scoping
 * because only TENANT_OWNER (the platform operator) and SUPER_ADMIN may
 * call it.
 *
 * <p>All queries use {@link JdbcTemplate} with native SQL because they span
 * the {@code tenant} and {@code auth} schemas (same database, different
 * schemas — no foreign data wrapper needed).
 */
@RestController
@RequestMapping("/v1/platform")
@RequiredArgsConstructor
public class PlatformOverviewController {

    private final JdbcTemplate jdbc;

    public record TenantSummary(
            UUID id,
            String name,
            String code,
            int orgCount,
            int branchCount,
            Instant createdAt
    ) {}

    public record PlatformOverviewDto(
            long tenantCount,
            long orgCount,
            long branchCount,
            long userCount,
            long activeTenantsLast30d,
            List<TenantSummary> recentTenants
    ) {}

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    public ApiResponse<PlatformOverviewDto> overview() {
        long tenantCount = countOrZero("SELECT COUNT(*) FROM tenant.tenants");
        long orgCount    = countOrZero("SELECT COUNT(*) FROM tenant.organizations");
        long branchCount = countOrZero("SELECT COUNT(*) FROM tenant.branches");
        long userCount   = countOrZero(
                "SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL");

        // TODO(active-tenants): the booking schema isn't owned by tenant-service
        // yet, and a cross-service join is overkill for this widget. Surface 0
        // for now; revisit when booking-service exposes a tenant-scoped read.
        long activeTenantsLast30d = 0L;

        List<TenantSummary> recent = jdbc.query(
                """
                SELECT t.id, t.name, t.code, t.created_at,
                       (SELECT COUNT(*) FROM tenant.organizations o WHERE o.tenant_id = t.id) AS org_count,
                       (SELECT COUNT(*) FROM tenant.branches b
                          JOIN tenant.organizations o ON o.id = b.org_id
                         WHERE o.tenant_id = t.id) AS branch_count
                FROM tenant.tenants t
                ORDER BY t.created_at DESC
                LIMIT 5
                """,
                (rs, n) -> new TenantSummary(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("code"),
                        rs.getInt("org_count"),
                        rs.getInt("branch_count"),
                        rs.getObject("created_at", java.sql.Timestamp.class).toInstant()
                )
        );

        return ApiResponse.ok(new PlatformOverviewDto(
                tenantCount, orgCount, branchCount, userCount,
                activeTenantsLast30d, recent
        ));
    }

    private long countOrZero(String sql) {
        Long v = jdbc.queryForObject(sql, Long.class);
        return v == null ? 0L : v;
    }
}
