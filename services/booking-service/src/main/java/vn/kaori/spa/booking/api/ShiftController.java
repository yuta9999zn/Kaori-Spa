package vn.kaori.spa.booking.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.Repositories.StaffRepository;
import vn.kaori.spa.booking.domain.Repositories.StaffShiftRepository;
import vn.kaori.spa.booking.domain.ShiftType;
import vn.kaori.spa.booking.domain.Staff;
import vn.kaori.spa.booking.domain.StaffShift;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final StaffShiftRepository shiftRepo;
    private final StaffRepository staffRepo;

    public record ShiftCell(UUID staffId, String staffCode, String staffName,
                            LocalDate date, ShiftType shiftType) {}

    public record MonthGrid(int year, int month, List<StaffRow> rows) {}

    public record StaffRow(UUID staffId, String code, String fullName, String nickname,
                           Map<String, ShiftType> byDate,
                           Map<String, Integer> stats) {}

    /**
     * Monthly grid suitable for direct display in the Shift Manager UI.
     * Returns one row per active staff in the branch, with one column per
     * day of the requested month.
     */
    @GetMapping("/grid")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','RECEPTIONIST')")
    public ApiResponse<MonthGrid> grid(@RequestParam UUID tenantId,
                                       @RequestParam UUID branchId,
                                       @RequestParam int year,
                                       @RequestParam int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate first = ym.atDay(1);
        LocalDate last  = ym.atEndOfMonth();

        List<Staff> staff = staffRepo.findAllByTenantIdAndBranchIdAndActiveTrue(tenantId, branchId);
        Map<UUID, List<StaffShift>> byStaff = new HashMap<>();
        for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
            List<StaffShift> dayShifts = shiftRepo.findByBranchAndDate(branchId, d);
            for (StaffShift s : dayShifts) {
                byStaff.computeIfAbsent(s.getStaffId(), k -> new ArrayList<>()).add(s);
            }
        }

        List<StaffRow> rows = new ArrayList<>();
        for (Staff st : staff) {
            Map<String, ShiftType> map = new TreeMap<>();
            Map<String, Integer> stats = new HashMap<>(Map.of("SANG", 0, "TOI", 0, "FULL", 0, "NGHI", 0));
            for (StaffShift s : byStaff.getOrDefault(st.getId(), List.of())) {
                String key = s.getWorkDate().toString();
                map.put(key, s.getShiftType());
                stats.merge(s.getShiftType().name(), 1, Integer::sum);
            }
            rows.add(new StaffRow(st.getId(), st.getCode(), st.getFullName(), st.getNickname(), map, stats));
        }
        return ApiResponse.ok(new MonthGrid(year, month, rows));
    }

    public record AssignReq(@NotNull UUID staffId, @NotNull LocalDate workDate, @NotNull ShiftType shiftType) {}
    public record BulkAssignReq(@NotNull UUID tenantId, @NotNull UUID branchId, @NotNull List<AssignReq> assignments) {}

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "shift.assign", entityType = "staff_shift", entityIdExpression = "#req.assignments.size()")
    @Transactional
    public ApiResponse<Integer> assign(@Valid @RequestBody BulkAssignReq req) {
        int count = 0;
        for (AssignReq a : req.assignments()) {
            Staff staff = staffRepo.findById(a.staffId())
                    .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Staff not found"));
            if (!staff.getBranchId().equals(req.branchId())) {
                throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN, "Staff not in branch");
            }
            // Upsert: one shift per (staff, date).
            List<StaffShift> existing = shiftRepo.findByStaffAndDate(a.staffId(), a.workDate());
            StaffShift s = existing.isEmpty() ? new StaffShift() : existing.get(0);
            s.setTenantId(req.tenantId());
            s.setBranchId(req.branchId());
            s.setStaffId(a.staffId());
            s.setWorkDate(a.workDate());
            s.setShiftType(a.shiftType());
            s.setOff(a.shiftType().off);
            s.setStartTime(a.shiftType().start);
            s.setEndTime(a.shiftType().end);
            shiftRepo.save(s);
            count++;
        }
        return ApiResponse.ok(count);
    }

    @DeleteMapping("/{shiftId}")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "shift.delete", entityType = "staff_shift", entityIdExpression = "#shiftId")
    public ApiResponse<Void> delete(@PathVariable UUID shiftId) {
        shiftRepo.deleteById(shiftId);
        return ApiResponse.ok(null);
    }
}
