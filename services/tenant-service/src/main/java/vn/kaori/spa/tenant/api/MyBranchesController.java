package vn.kaori.spa.tenant.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.security.TenantContext;
import vn.kaori.spa.tenant.domain.Branch;
import vn.kaori.spa.tenant.domain.BranchRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Returns the list of branches the current user can access.
 *
 * For now: returns all branches in the user's tenant. The next iteration will
 * restrict by user_role.scope_branch_id when the role-resolution service
 * lands. Used by the branch-admin header switcher.
 */
@RestController
@RequestMapping("/v1/me")
@RequiredArgsConstructor
public class MyBranchesController {

    private final BranchRepository branchRepo;

    public record BranchOption(UUID id, UUID orgId, String code, Map<String, String> name,
                               Map<String, String> address, BigDecimal lat, BigDecimal lng, boolean active) {}

    @GetMapping("/branches")
    // TODO(round-8): replace findAll() with a tenant-scoped query + cap. Today
    // we filter in-memory after pulling every branch, which is wasteful at
    // platform scale even though per-tenant N is small. Move filtering into the
    // repository and add a hard cap (~200 branches per user).
    public ApiResponse<List<BranchOption>> myBranches() {
        TenantContext.Principal p = TenantContext.get();
        if (p == null) return ApiResponse.ok(List.of());

        // Until role scoping is wired: list every branch owned by the user's tenant.
        // Filter by branchRepo through a tenant-aware query — Hibernate filter
        // would normally do this; here we use the existing simple finder.
        List<Branch> all = branchRepo.findAll().stream()
                .filter(b -> p.tenantId().equals(b.getTenantId()))
                .toList();
        return ApiResponse.ok(all.stream().map(b -> new BranchOption(
                b.getId(), b.getOrgId(), b.getCode(), b.getName(), b.getAddress(),
                b.getLat(), b.getLng(), b.isActive()
        )).toList());
    }
}
