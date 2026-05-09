package vn.kaori.spa.tenant.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;
import vn.kaori.spa.tenant.domain.Organization;
import vn.kaori.spa.tenant.domain.OrganizationRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/orgs")
@RequiredArgsConstructor
public class OrgController {

    private final OrganizationRepository repo;

    public record OrgDto(UUID id, UUID tenantId, String code, Map<String, String> name,
                        String slug, String primaryLocale) {}

    public record CreateOrgRequest(
            @NotBlank String code,
            @NotBlank String slug,
            @NotBlank String nameVi,
            String primaryLocale
    ) {}

    /**
     * Partial update payload for an organization. All fields are optional —
     * unset fields are ignored. {@code slug} is only applied if it is not
     * already in use by another organization.
     */
    public record UpdateOrgReq(
            Map<String, String> name,
            String primaryLocale,
            String slug
    ) {}

    @GetMapping
    @PreAuthorize("hasRole('TENANT_OWNER') or hasRole('SUPER_ADMIN')")
    // TODO(round-8): paginate. Currently returns the full list of orgs for the
    // tenant; safe at small N (typical tenant has <50 orgs) but unbounded in
    // theory. Switch to PagedResult<OrgDto> when the FE switcher consumes it.
    public ApiResponse<List<OrgDto>> list() {
        UUID tid = TenantContext.requireTenantId();
        return ApiResponse.ok(repo.findAllByTenantId(tid).stream().map(this::toDto).toList());
    }

    @GetMapping("/{code}")
    public ApiResponse<OrgDto> get(@PathVariable String code) {
        UUID tid = TenantContext.requireTenantId();
        Organization o = repo.findByTenantIdAndCode(tid, code)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Org not found"));
        return ApiResponse.ok(toDto(o));
    }

    @PostMapping
    @PreAuthorize("hasRole('TENANT_OWNER')")
    public ApiResponse<OrgDto> create(@Valid @RequestBody CreateOrgRequest req) {
        UUID tid = TenantContext.requireTenantId();
        if (repo.findByTenantIdAndCode(tid, req.code()).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Code already exists");
        }
        if (repo.findBySlug(req.slug()).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Slug already exists");
        }
        Organization o = new Organization();
        o.setTenantId(tid);
        o.setCode(req.code());
        o.setSlug(req.slug());
        o.setPrimaryLocale(req.primaryLocale() == null ? "vi" : req.primaryLocale());
        o.getName().put("vi", req.nameVi());
        return ApiResponse.ok(toDto(repo.save(o)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    @Audited(action = "org.update", entityType = "org", entityIdExpression = "#id")
    public ApiResponse<OrgDto> update(@PathVariable UUID id, @Valid @RequestBody UpdateOrgReq req) {
        UUID tid = TenantContext.requireTenantId();
        Organization o = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Org not found"));
        // Tenant scope guard — never let one tenant mutate another's org.
        if (!tid.equals(o.getTenantId())) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Org not found");
        }

        if (req.name() != null && !req.name().isEmpty()) {
            o.getName().putAll(req.name());
        }
        if (req.primaryLocale() != null && !req.primaryLocale().isBlank()) {
            o.setPrimaryLocale(req.primaryLocale());
        }
        if (req.slug() != null && !req.slug().isBlank() && !req.slug().equals(o.getSlug())) {
            repo.findBySlug(req.slug()).ifPresent(other -> {
                if (!other.getId().equals(o.getId())) {
                    throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Slug already exists");
                }
            });
            o.setSlug(req.slug());
        }
        return ApiResponse.ok(toDto(repo.save(o)));
    }

    private OrgDto toDto(Organization o) {
        return new OrgDto(o.getId(), o.getTenantId(), o.getCode(), o.getName(),
                o.getSlug(), o.getPrimaryLocale());
    }
}
