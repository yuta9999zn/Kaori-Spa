package vn.kaori.spa.auth.api;

import lombok.RequiredArgsConstructor;
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
 */
@RestController
@RequestMapping("/v1/orgs")
@RequiredArgsConstructor
public class MemberController {

    private final UserRoleRepository userRoleRepo;
    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;

    public record MemberDto(
            UUID userId, String fullName, String email, String phone, String status,
            List<String> roles, List<UUID> branches
    ) {}

    @GetMapping("/{orgId}/members")
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
}
