package vn.kaori.spa.auth.rbac;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.kaori.spa.auth.domain.Permission;
import vn.kaori.spa.auth.domain.PermissionRepository;
import vn.kaori.spa.auth.domain.Role;
import vn.kaori.spa.auth.domain.RolePermission;
import vn.kaori.spa.auth.domain.RolePermissionRepository;
import vn.kaori.spa.auth.domain.RoleRepository;
import vn.kaori.spa.auth.domain.UserRole;
import vn.kaori.spa.auth.domain.UserRoleRepository;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Simulates a permission check for the "kiểm tra quyền" UI.
 *
 * <p>Algorithm: collect every {@link UserRole} for the user, filter those whose scope
 * matches the requested (orgId, branchId) — unscoped roles always match — then for each
 * role check whether it grants the requested action. Result lists the role codes that
 * granted; if none granted, returns a denied reason.
 */
@Service
@RequiredArgsConstructor
public class PermissionCheckService {

    public record Result(boolean allowed, List<String> matchingRoles, String deniedReason) {}

    private final UserRoleRepository userRoleRepo;
    private final RoleRepository roleRepo;
    private final RolePermissionRepository rolePermRepo;
    private final PermissionRepository permRepo;

    public Result check(UUID userId, String action, UUID scopeOrgId, UUID scopeBranchId) {
        List<UserRole> assignments = userRoleRepo.findAllByUserId(userId);
        if (assignments.isEmpty()) {
            return new Result(false, List.of(), "User has no role assignments");
        }

        // Filter assignments whose scope is compatible with the requested scope.
        // An assignment with NULL scope is "unscoped" and always applies; an assignment
        // with a specific scope must match exactly.
        List<UserRole> applicable = assignments.stream()
                .filter(ur -> matchesScope(ur.getScopeOrgId(), scopeOrgId)
                        && matchesScope(ur.getScopeBranchId(), scopeBranchId))
                .toList();
        if (applicable.isEmpty()) {
            return new Result(false, List.of(), "No role assignment matches the requested scope");
        }

        Set<UUID> roleIds = applicable.stream().map(UserRole::getRoleId).collect(Collectors.toSet());
        Map<UUID, Role> rolesById = roleRepo.findAllById(roleIds).stream()
                .collect(Collectors.toMap(Role::getId, r -> r));

        List<RolePermission> rps = rolePermRepo.findAllByRoleIdIn(List.copyOf(roleIds));
        if (rps.isEmpty()) {
            return new Result(false, List.of(), "No matching role grants any permission");
        }

        Set<UUID> permIds = rps.stream().map(RolePermission::getPermissionId).collect(Collectors.toSet());
        Map<UUID, String> permCodeById = permRepo.findAllById(permIds).stream()
                .collect(Collectors.toMap(Permission::getId, Permission::getCode));

        // Roles that grant the requested action.
        Map<UUID, Set<String>> grantsByRole = new HashMap<>();
        for (RolePermission rp : rps) {
            String code = permCodeById.get(rp.getPermissionId());
            if (code == null) continue;
            grantsByRole.computeIfAbsent(rp.getRoleId(), k -> new HashSet<>()).add(code);
        }

        List<String> matching = grantsByRole.entrySet().stream()
                .filter(e -> e.getValue().contains(action))
                .map(e -> rolesById.get(e.getKey()))
                .filter(Objects::nonNull)
                .map(Role::getCode)
                .sorted()
                .toList();

        if (matching.isEmpty()) {
            return new Result(false, List.of(),
                    "User has " + applicable.size()
                            + " role assignment(s) in scope but none grants '" + action + "'");
        }
        return new Result(true, matching, null);
    }

    private static boolean matchesScope(UUID assignmentScope, UUID requestedScope) {
        // NULL on the assignment means "any scope" — always matches.
        if (assignmentScope == null) return true;
        // Assignment is scoped: caller must specify, and it must match.
        return assignmentScope.equals(requestedScope);
    }
}
