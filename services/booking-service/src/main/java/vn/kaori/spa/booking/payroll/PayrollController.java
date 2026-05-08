package vn.kaori.spa.booking.payroll;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final SalaryRecordRepository salaryRepo;
    private final PayrollService service;

    public record SalaryDto(UUID id, UUID staffId, String period,
                            BigDecimal baseSalary, BigDecimal commissionTotal,
                            BigDecimal bonus, BigDecimal deduction,
                            int daysWorked, int daysOff, int daysLate, int minutesWorked,
                            BigDecimal net, String status) {}

    @GetMapping("/{period}")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    public ApiResponse<List<SalaryDto>> list(@RequestParam UUID branchId, @PathVariable String period) {
        return ApiResponse.ok(salaryRepo.findAllByBranchIdAndPeriod(branchId, period)
                .stream().map(this::toDto).toList());
    }

    @PostMapping("/{period}/rebuild")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    @Audited(action = "payroll.rebuild", entityType = "salary_period", entityIdExpression = "#period")
    public ApiResponse<List<SalaryDto>> rebuild(@RequestParam UUID branchId, @PathVariable String period) {
        var rows = service.rebuildPeriod(branchId, YearMonth.parse(period));
        return ApiResponse.ok(rows.stream().map(this::toDto).toList());
    }

    @PostMapping("/{period}/lock")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    @Audited(action = "payroll.lock", entityType = "salary_period", entityIdExpression = "#period")
    public ApiResponse<Void> lock(@RequestParam UUID branchId, @PathVariable String period) {
        service.lock(branchId, YearMonth.parse(period), null);
        return ApiResponse.ok(null);
    }

    private SalaryDto toDto(SalaryRecord r) {
        return new SalaryDto(r.getId(), r.getStaffId(), r.getPeriod(),
                r.getBaseSalary(), r.getCommissionTotal(), r.getBonus(), r.getDeduction(),
                r.getDaysWorked(), r.getDaysOff(), r.getDaysLate(), r.getMinutesWorked(),
                r.getNet(), r.getStatus().name());
    }
}
