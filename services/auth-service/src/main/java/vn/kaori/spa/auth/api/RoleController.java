package vn.kaori.spa.auth.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.auth.domain.Role;
import vn.kaori.spa.auth.rbac.RoleService;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.security.TenantContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Role catalog management. All endpoints derive {@code tenantId} from the JWT
 * (TenantContext) so the caller cannot read or mutate roles in another tenant.
 */
@RestController
@RequestMapping("/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    public record RoleDto(UUID id, String code, Map<String, String> name,
                          String scope, boolean isSystem,
                          List<String> permissionCodes) {}

    public record CreateRoleReq(
            @NotBlank String code,
            @NotNull Map<String, String> name,
            @NotBlank String scope,
            List<String> permissionCodes
    ) {}

    public record UpdateRoleReq(
            Map<String, String> name,
            List<String> permissionCodes
    ) {}

    public record PermissionMatrixReq(@NotNull List<String> permissionCodes) {}

    public record PagedResult<T>(List<T> items, long total, int page, int size) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    public ApiResponse<PagedResult<RoleDto>> list(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        UUID tenantId = TenantContext.requireTenantId();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<Role> result = roleService.listPaged(
                tenantId, scope, q,
                PageRequest.of(safePage, safeSize, Sort.by("createdAt").descending())
        );
        List<RoleDto> items = result.getContent().stream().map(this::toDto).toList();
        return ApiResponse.ok(new PagedResult<>(items, result.getTotalElements(), safePage, safeSize));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "role.create", entityType = "role", entityIdExpression = "#req.code")
    public ApiResponse<RoleDto> create(@Valid @RequestBody CreateRoleReq req) {
        UUID tenantId = TenantContext.requireTenantId();
        Role r = roleService.create(tenantId, req.code(), req.name(), req.scope(), req.permissionCodes());
        return ApiResponse.ok(toDto(r));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    public ApiResponse<RoleDto> get(@PathVariable UUID id) {
        UUID tenantId = TenantContext.requireTenantId();
        return ApiResponse.ok(toDto(roleService.get(id, tenantId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "role.update", entityType = "role", entityIdExpression = "#id")
    public ApiResponse<RoleDto> update(@PathVariable UUID id, @Valid @RequestBody UpdateRoleReq req) {
        UUID tenantId = TenantContext.requireTenantId();
        Role r = roleService.update(id, tenantId, req.name(), req.permissionCodes());
        return ApiResponse.ok(toDto(r));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "role.delete", entityType = "role", entityIdExpression = "#id")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.requireTenantId();
        roleService.delete(id, tenantId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}/permissions")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    public ApiResponse<List<String>> getPermissions(@PathVariable UUID id) {
        UUID tenantId = TenantContext.requireTenantId();
        Role r = roleService.get(id, tenantId);
        return ApiResponse.ok(roleService.permissionCodesOf(r.getId()));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "role.permissions.set", entityType = "role", entityIdExpression = "#id")
    public ApiResponse<List<String>> setPermissions(@PathVariable UUID id,
                                                    @Valid @RequestBody PermissionMatrixReq req) {
        UUID tenantId = TenantContext.requireTenantId();
        Role r = roleService.get(id, tenantId);
        return ApiResponse.ok(roleService.replacePermissions(r, req.permissionCodes()));
    }

    private RoleDto toDto(Role r) {
        return new RoleDto(
                r.getId(), r.getCode(), r.getName(),
                r.getScope(), r.isSystem(),
                roleService.permissionCodesOf(r.getId())
        );
    }
}
