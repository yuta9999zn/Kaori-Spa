package vn.kaori.spa.auth.api;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.auth.domain.Role;
import vn.kaori.spa.auth.domain.RoleRepository;
import vn.kaori.spa.auth.domain.User;
import vn.kaori.spa.auth.domain.UserProfile;
import vn.kaori.spa.auth.domain.UserProfileRepository;
import vn.kaori.spa.auth.domain.UserRepository;
import vn.kaori.spa.auth.domain.UserRole;
import vn.kaori.spa.auth.domain.UserRoleRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.security.TenantContext;

import java.sql.Array;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Lists members (users) of an organization based on user_role assignments
 * scoped to that org. Used by the org-admin /member screen.
 *
 * Also exposes a tenant-wide listing at GET /v1/members for the tenant-admin
 * portal which needs to see ALL users in a tenant across orgs/branches.
 */
@RestController
@RequiredArgsConstructor
public class MemberController {

    private final UserRoleRepository userRoleRepo;
    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;
    private final JdbcTemplate jdbc;

    public record MemberDto(
            UUID userId, String fullName, String email, String phone, String status,
            List<String> roles, List<UUID> branches
    ) {}

    public record TenantMemberDto(
            UUID userId, String fullName, String email, String phone,
            String status, List<String> roles, List<String> branches,
            Instant lastLogin
    ) {}

    public record PagedResult<T>(List<T> items, int page, int size, long total) {}

    @GetMapping("/v1/orgs/{orgId}/members")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','BRANCH_MANAGER')")
    public ApiResponse<List<MemberDto>> listMembers(@PathVariable UUID orgId) {
        UUID tenantId = TenantContext.requireTenantId();

        List<UserRole> assignments = userRoleRepo.findAllByScopeOrgId(orgId);
        if (assignments.isEmpty()) return ApiResponse.ok(List.of());

        Set<UUID> userIds = assignments.stream().map(UserRole::getUserId).collect(Collectors.toSet());
        Set<UUID> roleIds = assignments.stream().map(UserRole::getRoleId).collect(Collectors.toSet());

        Map<UUID, User> usersById = userRepo.findAllById(userIds).stream()
                .filter(u -> tenantId.equals(u.getTenantId()) && u.getDeletedAt() == null)
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<UUID, Role> rolesById = roleRepo.findAllById(roleIds).stream()
                .filter(r -> tenantId.equals(r.getTenantId()))
                .collect(Collectors.toMap(Role::getId, r -> r));
        Map<UUID, UserProfile> profilesById = new HashMap<>();
        if (!usersById.isEmpty()) {
            profileRepo.findAllByUserIdIn(List.copyOf(usersById.keySet()))
                    .forEach(p -> profilesById.put(p.getUserId(), p));
        }

        // Group assignments by user, preserving insertion order so the response is stable.
        Map<UUID, List<UserRole>> byUser = new LinkedHashMap<>();
        for (UserRole ur : assignments) {
            if (!usersById.containsKey(ur.getUserId())) continue;
            byUser.computeIfAbsent(ur.getUserId(), k -> new ArrayList<>()).add(ur);
        }

        List<MemberDto> out = new ArrayList<>(byUser.size());
        for (var entry : byUser.entrySet()) {
            User u = usersById.get(entry.getKey());
            UserProfile p = profilesById.get(u.getId());
            List<String> roleCodes = entry.getValue().stream()
                    .map(ur -> rolesById.get(ur.getRoleId()))
                    .filter(java.util.Objects::nonNull)
                    .map(Role::getCode)
                    .distinct()
                    .sorted()
                    .toList();
            List<UUID> branches = entry.getValue().stream()
                    .map(UserRole::getScopeBranchId)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .toList();
            out.add(new MemberDto(
                    u.getId(),
                    p == null ? null : p.getFullName(),
                    u.getEmail(),
                    u.getPhone(),
                    u.getStatus(),
                    roleCodes,
                    branches
            ));
        }
        return ApiResponse.ok(out);
    }

    /**
     * Tenant-wide member listing for the tenant-admin /members page.
     *
     * <p>Returns all users in a tenant (deleted excluded) joined with their profile
     * and aggregated role assignments. SUPER_ADMIN may target any tenant via the
     * {@code tenantId} query param; TENANT_OWNER is always pinned to their own
     * tenant from {@link TenantContext}.
     *
     * <p>Branches are returned as scope_branch_id strings; the FE may resolve
     * names later via tenant-service. {@code lastLogin} is always {@code null}
     * until a {@code last_login} column is added to {@code auth.users} (TODO).
     */
    @GetMapping("/v1/members")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    public ApiResponse<PagedResult<TenantMemberDto>> listTenantMembers(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0) page = 0;
        if (size < 1) size = 1;
        if (size > 100) size = 100;

        // Tenant scoping: TENANT_OWNER cannot escape their own tenant.
        var principal = TenantContext.get();
        Set<String> roles = principal == null ? Set.of() : principal.roles();
        UUID effectiveTenantId;
        if (roles.contains("SUPER_ADMIN")) {
            effectiveTenantId = tenantId != null ? tenantId : TenantContext.requireTenantId();
        } else {
            effectiveTenantId = TenantContext.requireTenantId();
        }

        String trimmedQ = (q == null || q.isBlank()) ? null : q.trim();
        String trimmedStatus = (status == null || status.isBlank()) ? null : status.trim();
        int offset = page * size;

        // Count first so we can return total in the page envelope.
        Long total = jdbc.queryForObject(
                """
                SELECT COUNT(DISTINCT u.id)
                FROM auth.users u
                LEFT JOIN auth.user_profiles p ON p.user_id = u.id
                WHERE u.tenant_id = ?
                  AND u.deleted_at IS NULL
                  AND (?::text IS NULL
                       OR u.email ILIKE '%' || ? || '%'
                       OR p.full_name ILIKE '%' || ? || '%'
                       OR u.phone ILIKE '%' || ? || '%')
                  AND (?::text IS NULL OR u.status = ?)
                """,
                Long.class,
                effectiveTenantId,
                trimmedQ, trimmedQ, trimmedQ, trimmedQ,
                trimmedStatus, trimmedStatus
        );
        long totalCount = total == null ? 0L : total;

        List<TenantMemberDto> items = jdbc.query(
                """
                SELECT u.id, p.full_name, u.email, u.phone, u.status,
                       ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL) AS roles,
                       ARRAY_AGG(DISTINCT ur.scope_branch_id::text) FILTER (WHERE ur.scope_branch_id IS NOT NULL) AS branches
                FROM auth.users u
                LEFT JOIN auth.user_profiles p ON p.user_id = u.id
                LEFT JOIN auth.user_roles ur ON ur.user_id = u.id
                LEFT JOIN auth.roles r ON r.id = ur.role_id
                WHERE u.tenant_id = ?
                  AND u.deleted_at IS NULL
                  AND (?::text IS NULL
                       OR u.email ILIKE '%' || ? || '%'
                       OR p.full_name ILIKE '%' || ? || '%'
                       OR u.phone ILIKE '%' || ? || '%')
                  AND (?::text IS NULL OR u.status = ?)
                GROUP BY u.id, p.full_name, u.email, u.phone, u.status
                ORDER BY p.full_name NULLS LAST, u.email
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> {
                    UUID uid = rs.getObject("id", UUID.class);
                    String fullName = rs.getString("full_name");
                    String email = rs.getString("email");
                    String phone = rs.getString("phone");
                    String st = rs.getString("status");
                    List<String> roleCodes = sqlArrayToList(rs.getArray("roles"));
                    List<String> branchIds = sqlArrayToList(rs.getArray("branches"));
                    // TODO(last_login): no last_login column on auth.users yet — leave null.
                    return new TenantMemberDto(uid, fullName, email, phone, st,
                            roleCodes, branchIds, null);
                },
                effectiveTenantId,
                trimmedQ, trimmedQ, trimmedQ, trimmedQ,
                trimmedStatus, trimmedStatus,
                size, offset
        );

        ApiResponse.ApiMeta meta = new ApiResponse.ApiMeta(
                Instant.now(), null, page, size, totalCount
        );
        return ApiResponse.ok(new PagedResult<>(items, page, size, totalCount), meta);
    }

    private static List<String> sqlArrayToList(Array array) {
        if (array == null) return List.of();
        try {
            Object raw = array.getArray();
            if (raw instanceof Object[] arr) {
                List<String> out = new ArrayList<>(arr.length);
                for (Object o : arr) {
                    if (o != null) out.add(o.toString());
                }
                return out;
            }
            return List.of();
        } catch (java.sql.SQLException e) {
            return List.of();
        } finally {
            try { array.free(); } catch (java.sql.SQLException ignored) {}
        }
    }
}
