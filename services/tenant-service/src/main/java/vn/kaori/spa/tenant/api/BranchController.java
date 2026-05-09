package vn.kaori.spa.tenant.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;
import vn.kaori.spa.tenant.domain.Branch;
import vn.kaori.spa.tenant.domain.BranchRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/orgs/{orgId}/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchRepository repo;

    public record BranchDto(UUID id, UUID orgId, String code, Map<String, String> name,
                            Map<String, String> address, String phone,
                            BigDecimal lat, BigDecimal lng, boolean active) {}

    public record CreateBranchRequest(
            @NotBlank String code,
            @NotBlank String nameVi,
            @NotBlank String addressVi,
            String phone,
            BigDecimal lat,
            BigDecimal lng,
            String directionsUrl
    ) {}

    public record PagedResult<T>(List<T> items, long total, int page, int size) {}

    @GetMapping
    @PreAuthorize("hasRole('ORG_OWNER') or hasRole('TENANT_OWNER') or hasRole('BRANCH_MANAGER')")
    public ApiResponse<PagedResult<BranchDto>> list(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q
    ) {
        UUID tid = TenantContext.requireTenantId();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String trimmedQ = (q == null || q.isBlank()) ? null : q.trim();
        Page<Branch> result = repo.findPaged(
                tid, orgId, trimmedQ,
                PageRequest.of(safePage, safeSize, Sort.by("createdAt").descending())
        );
        List<BranchDto> items = result.getContent().stream().map(this::toDto).toList();
        return ApiResponse.ok(new PagedResult<>(items, result.getTotalElements(), safePage, safeSize));
    }

    @PostMapping
    @PreAuthorize("hasRole('ORG_OWNER') or hasRole('TENANT_OWNER')")
    public ApiResponse<BranchDto> create(@PathVariable UUID orgId,
                                         @Valid @RequestBody CreateBranchRequest req) {
        UUID tid = TenantContext.requireTenantId();
        if (repo.findByTenantIdAndOrgIdAndCode(tid, orgId, req.code()).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Branch code already exists");
        }
        Branch b = new Branch();
        b.setTenantId(tid);
        b.setOrgId(orgId);
        b.setCode(req.code());
        b.setPhone(req.phone());
        b.setLat(req.lat());
        b.setLng(req.lng());
        b.setDirectionsUrl(req.directionsUrl());
        b.getName().put("vi", req.nameVi());
        b.getAddress().put("vi", req.addressVi());
        return ApiResponse.ok(toDto(repo.save(b)));
    }

    @PutMapping("/{branchId}")
    @PreAuthorize("hasRole('ORG_OWNER') or hasRole('TENANT_OWNER')")
    public ApiResponse<BranchDto> update(@PathVariable UUID orgId,
                                         @PathVariable UUID branchId,
                                         @RequestBody CreateBranchRequest req) {
        UUID tid = TenantContext.requireTenantId();
        Branch b = repo.findById(branchId)
                .filter(x -> x.getTenantId().equals(tid) && x.getOrgId().equals(orgId))
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Branch not found"));
        if (req.nameVi() != null) b.getName().put("vi", req.nameVi());
        if (req.addressVi() != null) b.getAddress().put("vi", req.addressVi());
        if (req.phone() != null) b.setPhone(req.phone());
        if (req.lat() != null) b.setLat(req.lat());
        if (req.lng() != null) b.setLng(req.lng());
        return ApiResponse.ok(toDto(repo.save(b)));
    }

    @DeleteMapping("/{branchId}")
    @PreAuthorize("hasRole('TENANT_OWNER') or hasRole('ORG_OWNER')")
    public ApiResponse<Void> delete(@PathVariable UUID orgId, @PathVariable UUID branchId) {
        UUID tid = TenantContext.requireTenantId();
        Branch b = repo.findById(branchId)
                .filter(x -> x.getTenantId().equals(tid) && x.getOrgId().equals(orgId))
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Branch not found"));
        b.setActive(false);
        repo.save(b);
        return ApiResponse.ok(null);
    }

    private BranchDto toDto(Branch b) {
        return new BranchDto(b.getId(), b.getOrgId(), b.getCode(), b.getName(),
                b.getAddress(), b.getPhone(), b.getLat(), b.getLng(), b.isActive());
    }
}
