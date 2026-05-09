package vn.kaori.spa.auth.rbac;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.auth.domain.Permission;
import vn.kaori.spa.auth.domain.PermissionRepository;
import vn.kaori.spa.auth.domain.Role;
import vn.kaori.spa.auth.domain.RolePermission;
import vn.kaori.spa.auth.domain.RolePermissionRepository;
import vn.kaori.spa.auth.domain.RoleRepository;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Domain service for role CRUD + role-permission matrix maintenance.
 *
 * <p>System roles ({@code is_system = true}) cannot be deleted; only their permission
 * matrix can be edited. The seeded permissions are the only ones that can be granted —
 * unknown permission codes throw {@link ErrorCodes#VALIDATION_FAILED}.
 */
@Service
@RequiredArgsConstructor
public class RoleService {

    private static final Set<String> ALLOWED_SCOPES = Set.of("tenant", "org", "branch");

    private final RoleRepository roleRepo;
    private final PermissionRepository permRepo;
    private final RolePermissionRepository rolePermRepo;

    public List<Role> list(UUID tenantId, String scopeFilter) {
        if (scopeFilter != null && !scopeFilter.isBlank()) {
            return roleRepo.findAllByTenantIdAndScope(tenantId, scopeFilter);
        }
        return roleRepo.findAllByTenantId(tenantId);
    }

    public Role get(UUID id, UUID tenantId) {
        return roleRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new AppException(
                        ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Role not found"));
    }

    @Transactional
    public Role create(UUID tenantId, String code, Map<String, String> name, String scope,
                       List<String> permissionCodes) {
        if (!ALLOWED_SCOPES.contains(scope)) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "scope must be one of " + ALLOWED_SCOPES);
        }
        if (roleRepo.findByTenantIdAndCode(tenantId, code).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Role code exists");
        }
        Role r = new Role();
        r.setTenantId(tenantId);
        r.setCode(code);
        r.setName(name);
        r.setScope(scope);
        r.setSystem(false);
        r = roleRepo.save(r);
        replacePermissions(r, permissionCodes);
        return r;
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "rolePermissions", key = "#id"),
            // We don't track which users hold this role, so blow the whole userAccess
            // cache. Role updates are rare (admin action) so the hit-rate cost is fine.
            @CacheEvict(value = "userAccess", allEntries = true)
    })
    public Role update(UUID id, UUID tenantId, Map<String, String> name, List<String> permissionCodes) {
        Role r = get(id, tenantId);
        if (name != null && !name.isEmpty()) {
            r.setName(name);
        }
        if (permissionCodes != null) {
            replacePermissions(r, permissionCodes);
        }
        return roleRepo.save(r);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "rolePermissions", key = "#id"),
            @CacheEvict(value = "userAccess", allEntries = true)
    })
    public void delete(UUID id, UUID tenantId) {
        Role r = get(id, tenantId);
        if (r.isSystem()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Cannot delete system role");
        }
        rolePermRepo.deleteByRoleId(r.getId());
        roleRepo.delete(r);
    }

    @Transactional
    public List<String> replacePermissions(Role role, List<String> permissionCodes) {
        rolePermRepo.deleteByRoleId(role.getId());
        if (permissionCodes == null || permissionCodes.isEmpty()) {
            return List.of();
        }
        Set<String> wanted = new HashSet<>(permissionCodes);
        List<Permission> resolved = permRepo.findAllByCodeIn(wanted);
        if (resolved.size() != wanted.size()) {
            Set<String> found = resolved.stream().map(Permission::getCode).collect(Collectors.toSet());
            wanted.removeAll(found);
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Unknown permission codes: " + wanted);
        }
        for (Permission p : resolved) {
            rolePermRepo.save(new RolePermission(role.getId(), p.getId()));
        }
        return resolved.stream().map(Permission::getCode).sorted().toList();
    }

    public List<String> permissionCodesOf(UUID roleId) {
        List<RolePermission> rps = rolePermRepo.findAllByRoleId(roleId);
        if (rps.isEmpty()) return List.of();
        Set<UUID> permIds = rps.stream().map(RolePermission::getPermissionId).collect(Collectors.toSet());
        return permRepo.findAllById(permIds).stream()
                .map(Permission::getCode)
                .sorted()
                .toList();
    }
}
