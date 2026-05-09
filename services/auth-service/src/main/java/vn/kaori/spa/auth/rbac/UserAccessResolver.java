package vn.kaori.spa.auth.rbac;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.auth.domain.Permission;
import vn.kaori.spa.auth.domain.PermissionRepository;
import vn.kaori.spa.auth.domain.Role;
import vn.kaori.spa.auth.domain.RolePermission;
import vn.kaori.spa.auth.domain.RolePermissionRepository;
import vn.kaori.spa.auth.domain.RoleRepository;
import vn.kaori.spa.auth.domain.UserRole;
import vn.kaori.spa.auth.domain.UserRoleRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Resolves the runtime access profile for a user: their role codes, their permission
 * codes, and any unambiguous org / branch scope encoded in their {@code user_roles}
 * grants.
 *
 * <p>Used at JWT issue time so the access token carries real RBAC claims that match
 * the rows in {@code auth.user_roles} / {@code auth.roles}, instead of the historical
 * {@code Set.of("CUSTOMER")} stub.
 */
@Service
@RequiredArgsConstructor
public class UserAccessResolver {

    private static final Set<String> CUSTOMER_DEFAULT_ROLES = Set.of("CUSTOMER");
    private static final Set<String> CUSTOMER_DEFAULT_PERMS =
            Set.of("booking:read", "booking:create");

    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;

    /**
     * Snapshot of an authenticated user's RBAC profile, ready to embed in a JWT.
     *
     * @param roles         set of role codes (e.g. {@code TENANT_OWNER}, {@code BRANCH_MANAGER})
     * @param permissions   set of granted permission codes (union across all roles)
     * @param orgId         single org scope if and only if every grant agrees on one org;
     *                      otherwise {@code null} so the frontend forces a picker
     * @param branchId      single branch scope under the same rules as {@code orgId}
     */
    public record AccessProfile(Set<String> roles,
                                Set<String> permissions,
                                UUID orgId,
                                UUID branchId) {}

    /**
     * Resolve an {@link AccessProfile} for the given user.
     *
     * <p>Behaviour:
     * <ul>
     *   <li>If the user has zero rows in {@code user_roles} (typical for self-registered
     *       end-customers), return the legacy {@code CUSTOMER} default so existing
     *       client-website flows keep working.</li>
     *   <li>Otherwise pull every role grant, project to role codes + the union of role
     *       permissions, and try to collapse {@code scope_org_id} / {@code scope_branch_id}
     *       to a single value.</li>
     * </ul>
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "userAccess", key = "#userId")
    public AccessProfile resolve(UUID userId) {
        List<UserRole> grants = userRoleRepository.findAllByUserId(userId);
        if (grants.isEmpty()) {
            return new AccessProfile(CUSTOMER_DEFAULT_ROLES, CUSTOMER_DEFAULT_PERMS, null, null);
        }

        Set<UUID> roleIds = grants.stream()
                .map(UserRole::getRoleId)
                .collect(Collectors.toSet());

        // Preserve insertion order for stable JWT payloads (helpful for tests / cache keys).
        Map<UUID, Role> rolesById = new LinkedHashMap<>();
        for (Role r : roleRepository.findAllById(roleIds)) {
            rolesById.put(r.getId(), r);
        }

        Set<String> roleCodes = rolesById.values().stream()
                .map(Role::getCode)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));

        Set<String> perms = resolvePermissions(rolesById.keySet());

        UUID orgScope = singleOrNull(grants.stream()
                .map(UserRole::getScopeOrgId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet()));

        UUID branchScope = singleOrNull(grants.stream()
                .map(UserRole::getScopeBranchId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet()));

        return new AccessProfile(roleCodes, perms, orgScope, branchScope);
    }

    private Set<String> resolvePermissions(Set<UUID> roleIds) {
        if (roleIds.isEmpty()) {
            return Set.of();
        }
        List<RolePermission> bindings =
                rolePermissionRepository.findAllByRoleIdIn(List.copyOf(roleIds));
        if (bindings.isEmpty()) {
            return Set.of();
        }
        Set<UUID> permIds = bindings.stream()
                .map(RolePermission::getPermissionId)
                .collect(Collectors.toSet());
        return permissionRepository.findAllById(permIds).stream()
                .map(Permission::getCode)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    /**
     * Return the single element of {@code values} or {@code null} if the set is empty
     * or has more than one element. Used to project a list of scope ids down to one
     * unambiguous value for the JWT.
     */
    private static UUID singleOrNull(Set<UUID> values) {
        return Optional.of(values).filter(v -> v.size() == 1)
                .map(v -> v.iterator().next())
                .orElse(null);
    }
}
