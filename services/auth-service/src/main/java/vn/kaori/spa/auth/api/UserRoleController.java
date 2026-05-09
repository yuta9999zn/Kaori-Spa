package vn.kaori.spa.auth.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
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
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manage user-to-role assignments. Always tenant-scoped: a caller can only
 * grant a role that lives in the same tenant as the user being assigned.
 */
@RestController
@RequestMapping("/v1/user-roles")
@RequiredArgsConstructor
public class UserRoleController {

    private final UserRoleRepository userRoleRepo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final UserProfileRepository profileRepo;

    public record UserRoleDto(
            UUID userId, String userEmail, String userFullName,
            UUID roleId, String roleCode, Map<String, String> roleName,
            UUID scopeOrgId, UUID scopeBranchId,
            Instant grantedAt
    ) {}

    public record AssignReq(
            @NotNull UUID userId,
            @NotNull UUID roleId,
            UUID scopeOrgId,
            UUID scopeBranchId
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    // TODO(round-8): paginate. Filtered by (userId, orgId, branchId) so result
    // sets are usually small, but a tenant-wide call (no filters) could grow
    // unbounded. Switch to PagedResult once the FE consumes it.
    public ApiResponse<List<UserRoleDto>> list(@RequestParam(required = false) UUID userId,
                                                @RequestParam(required = false) UUID orgId,
                                                @RequestParam(required = false) UUID branchId) {
        UUID tenantId = TenantContext.requireTenantId();
        List<UserRole> assignments = userRoleRepo.search(userId, orgId, branchId);
        if (assignments.isEmpty()) return ApiResponse.ok(List.of());
        return ApiResponse.ok(toDtos(assignments, tenantId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "user_role.assign", entityType = "user_role", entityIdExpression = "#req.userId")
    @CacheEvict(value = "userAccess", key = "#req.userId")
    public ApiResponse<UserRoleDto> assign(@Valid @RequestBody AssignReq req) {
        UUID tenantId = TenantContext.requireTenantId();

        User u = userRepo.findById(req.userId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "User not found"));
        if (!u.getTenantId().equals(tenantId)) {
            throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN, "User is in another tenant");
        }
        Role r = roleRepo.findByIdAndTenantId(req.roleId(), tenantId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Role not found"));

        UserRole ur = new UserRole(u.getId(), r.getId(), req.scopeOrgId(), req.scopeBranchId());
        userRoleRepo.save(ur);
        return ApiResponse.ok(toDto(ur, u, r));
    }

    @DeleteMapping("/{userId}/{roleId}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "user_role.revoke", entityType = "user_role", entityIdExpression = "#userId")
    @CacheEvict(value = "userAccess", key = "#userId")
    public ApiResponse<Void> revoke(@PathVariable UUID userId, @PathVariable UUID roleId) {
        UUID tenantId = TenantContext.requireTenantId();
        // Ensure both belong to tenant before deleting (defence in depth).
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "User not found"));
        if (!u.getTenantId().equals(tenantId)) {
            throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN, "User is in another tenant");
        }
        roleRepo.findByIdAndTenantId(roleId, tenantId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Role not found"));

        int deleted = userRoleRepo.deleteByUserIdAndRoleId(userId, roleId);
        if (deleted == 0) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Assignment not found");
        }
        return ApiResponse.ok(null);
    }

    private UserRoleDto toDto(UserRole ur, User u, Role r) {
        UserProfile profile = profileRepo.findById(u.getId()).orElse(null);
        String fullName = profile != null ? profile.getFullName() : null;
        return new UserRoleDto(
                u.getId(), u.getEmail(), fullName,
                r.getId(), r.getCode(), r.getName(),
                ur.getScopeOrgId(), ur.getScopeBranchId(),
                ur.getGrantedAt()
        );
    }

    private List<UserRoleDto> toDtos(List<UserRole> assignments, UUID tenantId) {
        Set<UUID> userIds = assignments.stream().map(UserRole::getUserId).collect(Collectors.toSet());
        Set<UUID> roleIds = assignments.stream().map(UserRole::getRoleId).collect(Collectors.toSet());

        Map<UUID, User> usersById = userRepo.findAllById(userIds).stream()
                .filter(u -> tenantId.equals(u.getTenantId()))
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<UUID, Role> rolesById = roleRepo.findAllById(roleIds).stream()
                .filter(r -> tenantId.equals(r.getTenantId()))
                .collect(Collectors.toMap(Role::getId, r -> r));
        Map<UUID, UserProfile> profilesById = new HashMap<>();
        if (!usersById.isEmpty()) {
            profileRepo.findAllByUserIdIn(List.copyOf(usersById.keySet()))
                    .forEach(p -> profilesById.put(p.getUserId(), p));
        }

        return assignments.stream()
                .filter(ur -> usersById.containsKey(ur.getUserId()) && rolesById.containsKey(ur.getRoleId()))
                .map(ur -> {
                    User u = usersById.get(ur.getUserId());
                    Role r = rolesById.get(ur.getRoleId());
                    UserProfile p = profilesById.get(u.getId());
                    return new UserRoleDto(
                            u.getId(), u.getEmail(), p == null ? null : p.getFullName(),
                            r.getId(), r.getCode(), r.getName(),
                            ur.getScopeOrgId(), ur.getScopeBranchId(),
                            ur.getGrantedAt()
                    );
                })
                .toList();
    }
}
