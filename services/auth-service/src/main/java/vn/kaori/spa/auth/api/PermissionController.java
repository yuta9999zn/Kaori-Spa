package vn.kaori.spa.auth.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.auth.domain.Permission;
import vn.kaori.spa.auth.domain.PermissionRepository;
import vn.kaori.spa.auth.rbac.PermissionCheckService;
import vn.kaori.spa.shared.api.ApiResponse;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Read-only permission catalog (used by the role-permission matrix UI) plus the
 * permission-check simulator (used by the "kiểm tra quyền" page).
 */
@RestController
@RequestMapping("/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRepository permRepo;
    private final PermissionCheckService checkService;

    public record PermissionDto(UUID id, String code, Map<String, String> name, String group) {}

    public record CheckPermissionReq(
            @NotNull UUID userId,
            @NotBlank String action,
            UUID scopeOrgId,
            UUID scopeBranchId
    ) {}

    public record CheckPermissionRes(boolean allowed, List<String> matchingRoles, String deniedReason) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','BRANCH_MANAGER')")
    public ApiResponse<List<PermissionDto>> list() {
        List<PermissionDto> all = permRepo.findAll().stream()
                .sorted(Comparator.comparing(Permission::getGroupName).thenComparing(Permission::getCode))
                .map(p -> new PermissionDto(p.getId(), p.getCode(), p.getName(), p.getGroupName()))
                .toList();
        return ApiResponse.ok(all);
    }

    @PostMapping("/check")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    public ApiResponse<CheckPermissionRes> check(@Valid @RequestBody CheckPermissionReq req) {
        var r = checkService.check(req.userId(), req.action(), req.scopeOrgId(), req.scopeBranchId());
        return ApiResponse.ok(new CheckPermissionRes(r.allowed(), r.matchingRoles(), r.deniedReason()));
    }
}
