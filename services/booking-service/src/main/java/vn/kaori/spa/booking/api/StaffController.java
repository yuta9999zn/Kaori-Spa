package vn.kaori.spa.booking.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.Repositories.StaffRepository;
import vn.kaori.spa.booking.domain.Repositories.StaffSkillRepository;
import vn.kaori.spa.booking.domain.Staff;
import vn.kaori.spa.booking.domain.StaffSkill;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffRepository staffRepo;
    private final StaffSkillRepository skillRepo;

    public record StaffDto(UUID id, String code, String fullName, String nickname,
                           String roleInBranch, boolean active) {}

    public record CreateStaffReq(@NotNull UUID tenantId, @NotNull UUID branchId,
                                 @NotBlank String code, @NotBlank String fullName,
                                 String nickname, String gender, String roleInBranch) {}

    public record SkillReq(@NotBlank String serviceCode, int skillLevel) {}

    public record PagedResult<T>(List<T> items, long total, int page, int size) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','RECEPTIONIST')")
    public ApiResponse<PagedResult<StaffDto>> list(
            @RequestParam UUID tenantId,
            @RequestParam UUID branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String q
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String trimmedQ = (q == null || q.isBlank()) ? null : q.trim();
        Page<Staff> result = staffRepo.findPaged(
                tenantId, branchId, trimmedQ,
                PageRequest.of(safePage, safeSize, Sort.by("createdAt").descending())
        );
        List<StaffDto> items = result.getContent().stream().map(this::toDto).toList();
        return ApiResponse.ok(new PagedResult<>(items, result.getTotalElements(), safePage, safeSize));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "staff.create", entityType = "staff", entityIdExpression = "#req.code")
    public ApiResponse<StaffDto> create(@Valid @RequestBody CreateStaffReq req) {
        if (staffRepo.findByBranchIdAndCode(req.branchId(), req.code()).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Staff code exists");
        }
        Staff s = new Staff();
        s.setTenantId(req.tenantId());
        s.setBranchId(req.branchId());
        s.setCode(req.code());
        s.setFullName(req.fullName());
        s.setNickname(req.nickname());
        s.setGender(req.gender());
        if (req.roleInBranch() != null) s.setRoleInBranch(req.roleInBranch());
        return ApiResponse.ok(toDto(staffRepo.save(s)));
    }

    @PostMapping("/{staffId}/skills")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "staff.skill.set", entityType = "staff_skill", entityIdExpression = "#staffId")
    public ApiResponse<Void> setSkill(@PathVariable UUID staffId, @Valid @RequestBody SkillReq req) {
        Staff s = staffRepo.findById(staffId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Staff not found"));
        skillRepo.save(new StaffSkill(s.getId(), req.serviceCode(), req.skillLevel()));
        return ApiResponse.ok(null);
    }

    private StaffDto toDto(Staff s) {
        return new StaffDto(s.getId(), s.getCode(), s.getFullName(), s.getNickname(),
                s.getRoleInBranch(), s.isActive());
    }
}
