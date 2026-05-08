package vn.kaori.spa.booking.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.*;
import vn.kaori.spa.booking.domain.Repositories.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Timekeeping (chấm công) endpoints. Designed to be invoked from a tablet at
 * the front desk, a kiosk, or the manager's web UI.
 *
 * The check-in / check-out logic computes status against the assigned shift
 * with a configurable grace window (default 10 minutes).
 */
@RestController
@RequestMapping("/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private static final int GRACE_LATE_MIN = 10;
    private static final int GRACE_EARLY_OUT_MIN = 10;
    private static final ZoneId BRANCH_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AttendanceRepository attendanceRepo;
    private final StaffShiftRepository shiftRepo;
    private final StaffRepository staffRepo;

    public record AttendanceDto(UUID staffId, String staffName, String staffNickname, LocalDate date,
                                String shiftType, LocalTime expectedStart, LocalTime expectedEnd,
                                Instant actualIn, Instant actualOut, String status,
                                Integer minutesWorked, Integer minutesLate) {}

    public record CheckPunchReq(UUID staffId, UUID tenantId, UUID branchId) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','RECEPTIONIST')")
    public ApiResponse<List<AttendanceDto>> dayList(@RequestParam UUID branchId,
                                                    @RequestParam(required = false) LocalDate date) {
        LocalDate d = date == null ? LocalDate.now(BRANCH_ZONE) : date;
        var rows = attendanceRepo.findAllByBranchIdAndWorkDate(branchId, d);
        var staffMap = new HashMap<UUID, Staff>();
        rows.forEach(r -> staffRepo.findById(r.getStaffId()).ifPresent(s -> staffMap.put(s.getId(), s)));
        var shiftMap = shiftRepo.findByBranchAndDate(branchId, d).stream()
                .collect(java.util.stream.Collectors.toMap(StaffShift::getStaffId, s -> s, (a, b) -> a));
        return ApiResponse.ok(rows.stream().map(r -> {
            var s = staffMap.get(r.getStaffId());
            var sh = shiftMap.get(r.getStaffId());
            return new AttendanceDto(
                    r.getStaffId(),
                    s == null ? null : s.getFullName(),
                    s == null ? null : s.getNickname(),
                    r.getWorkDate(),
                    sh == null ? null : sh.getShiftType().name(),
                    r.getExpectedStart(), r.getExpectedEnd(),
                    r.getActualIn(), r.getActualOut(),
                    r.getStatus().name(),
                    r.getMinutesWorked(), r.getMinutesLate()
            );
        }).toList());
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST')")
    @Audited(action = "attendance.checkin", entityType = "attendance", entityIdExpression = "#req.staffId")
    @Transactional
    public ApiResponse<AttendanceDto> checkIn(@RequestBody CheckPunchReq req) {
        Staff staff = staffRepo.findById(req.staffId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Staff not found"));

        Instant now = Instant.now();
        LocalDate today = now.atZone(BRANCH_ZONE).toLocalDate();
        var rec = attendanceRepo.findByStaffIdAndWorkDate(req.staffId(), today)
                .orElseGet(() -> seedRecord(staff, today, req.tenantId(), req.branchId()));

        if (rec.getActualIn() != null) {
            return ApiResponse.ok(toDto(rec, staff));  // already checked in, return current state
        }

        rec.setActualIn(now);

        if (rec.getStatus() == Attendance.Status.off) {
            // Working on a day-off — keep status but flag in note.
            rec.setNote(append(rec.getNote(), "Worked on day-off"));
        } else if (rec.getExpectedStart() != null) {
            LocalTime nowLocal = now.atZone(BRANCH_ZONE).toLocalTime();
            int diff = (int) ChronoUnit.MINUTES.between(rec.getExpectedStart(), nowLocal);
            if (diff > GRACE_LATE_MIN) {
                rec.setStatus(Attendance.Status.late);
                rec.setMinutesLate(diff);
            } else {
                rec.setStatus(Attendance.Status.present);
                rec.setMinutesLate(Math.max(0, diff));
            }
        } else {
            rec.setStatus(Attendance.Status.no_shift);
        }
        rec.setUpdatedAt(now);
        attendanceRepo.save(rec);
        return ApiResponse.ok(toDto(rec, staff));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST')")
    @Audited(action = "attendance.checkout", entityType = "attendance", entityIdExpression = "#req.staffId")
    @Transactional
    public ApiResponse<AttendanceDto> checkOut(@RequestBody CheckPunchReq req) {
        Staff staff = staffRepo.findById(req.staffId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Staff not found"));

        Instant now = Instant.now();
        LocalDate today = now.atZone(BRANCH_ZONE).toLocalDate();
        var rec = attendanceRepo.findByStaffIdAndWorkDate(req.staffId(), today)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.BAD_REQUEST,
                        "No check-in found for today"));

        if (rec.getActualIn() == null) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Check-in first before check-out");
        }
        rec.setActualOut(now);
        int worked = (int) ChronoUnit.MINUTES.between(rec.getActualIn(), now);
        rec.setMinutesWorked(worked);

        if (rec.getExpectedEnd() != null) {
            LocalTime nowLocal = now.atZone(BRANCH_ZONE).toLocalTime();
            int diff = (int) ChronoUnit.MINUTES.between(nowLocal, rec.getExpectedEnd());
            if (diff > GRACE_EARLY_OUT_MIN && rec.getStatus() != Attendance.Status.late) {
                rec.setStatus(Attendance.Status.early_out);
            }
        }
        rec.setUpdatedAt(now);
        attendanceRepo.save(rec);
        return ApiResponse.ok(toDto(rec, staff));
    }

    private Attendance seedRecord(Staff staff, LocalDate date, UUID tenantId, UUID branchId) {
        var rec = new Attendance();
        rec.setTenantId(tenantId);
        rec.setBranchId(branchId);
        rec.setStaffId(staff.getId());
        rec.setWorkDate(date);
        var shifts = shiftRepo.findByStaffAndDate(staff.getId(), date);
        if (shifts.isEmpty()) {
            rec.setStatus(Attendance.Status.no_shift);
        } else {
            StaffShift s = shifts.get(0);
            rec.setShiftId(s.getId());
            rec.setExpectedStart(s.getStartTime());
            rec.setExpectedEnd(s.getEndTime());
            rec.setStatus(s.getShiftType() == ShiftType.NGHI ? Attendance.Status.off : Attendance.Status.scheduled);
        }
        return rec;
    }

    private AttendanceDto toDto(Attendance r, Staff s) {
        return new AttendanceDto(
                r.getStaffId(),
                s == null ? null : s.getFullName(),
                s == null ? null : s.getNickname(),
                r.getWorkDate(),
                r.getShiftId() == null ? null : shiftRepo.findById(r.getShiftId()).map(x -> x.getShiftType().name()).orElse(null),
                r.getExpectedStart(), r.getExpectedEnd(),
                r.getActualIn(), r.getActualOut(),
                r.getStatus().name(),
                r.getMinutesWorked(), r.getMinutesLate()
        );
    }

    private static String append(String existing, String add) {
        return existing == null || existing.isBlank() ? add : existing + " | " + add;
    }
}
