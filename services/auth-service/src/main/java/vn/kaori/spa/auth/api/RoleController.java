package vn.kaori.spa.auth.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    // TODO(round-8): paginate if a tenant ever defines >100 custom roles.
    // Today every tenant has <30 roles (system + a few custom) so this is safe.
    public ApiResponse<List<RoleDto>> list(@RequestParam(required = false) String scope) {
        UUID tenantId = TenantContext.requireTenantId();
        List<Role> roles = roleService.list(tenantId, scope);
        return ApiResponse.ok(roles.stream().map(this::toDto).toList());
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
