package vn.kaori.spa.booking.api;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import vn.kaori.spa.booking.domain.Repositories.StaffShiftRepository;
import vn.kaori.spa.booking.domain.StaffShift;

import java.time.*;
import java.util.List;
import java.util.UUID;

/**
 * Decides whether a given staff is on shift covering a booking window.
 *
 * Rules:
 *   * If any `is_off=true` shift on that date overlaps the window → not on shift.
 *   * Otherwise the requested window must be fully contained in at least one
 *     working shift on that date.
 *   * If the window crosses midnight, both dates must be covered (rare for
 *     a single booking item — kept simple).
 *
 * Branch timezone resolution: passed in by caller. Defaults to Asia/Ho_Chi_Minh.
 */
@Component
@RequiredArgsConstructor
public class ShiftChecker {

    private final StaffShiftRepository shiftRepo;

    public boolean isOnShift(UUID staffId, Instant start, Instant end, ZoneId branchZone) {
        ZoneId zone = branchZone == null ? ZoneId.of("Asia/Ho_Chi_Minh") : branchZone;
        LocalDateTime startLocal = start.atZone(zone).toLocalDateTime();
        LocalDateTime endLocal   = end.atZone(zone).toLocalDateTime();
        if (!startLocal.toLocalDate().equals(endLocal.toLocalDate())) {
            // For window spanning midnight require both days valid.
            return isOnShiftSameDay(staffId, startLocal, endLocal.toLocalDate().atTime(LocalTime.MIDNIGHT))
                    && isOnShiftSameDay(staffId, endLocal.toLocalDate().atStartOfDay(), endLocal);
        }
        return isOnShiftSameDay(staffId, startLocal, endLocal);
    }

    private boolean isOnShiftSameDay(UUID staffId, LocalDateTime startLocal, LocalDateTime endLocal) {
        LocalDate date = startLocal.toLocalDate();
        LocalTime sT = startLocal.toLocalTime();
        LocalTime eT = endLocal.toLocalTime();

        List<StaffShift> shifts = shiftRepo.findByStaffAndDate(staffId, date);
        if (shifts.isEmpty()) return false;

        // Reject if an OFF window overlaps.
        boolean offOverlap = shifts.stream()
                .filter(StaffShift::isOff)
                .anyMatch(s -> overlaps(s.getStartTime(), s.getEndTime(), sT, eT));
        if (offOverlap) return false;

        // Accept only if the booking is fully inside at least one working shift.
        return shifts.stream()
                .filter(s -> !s.isOff())
                .anyMatch(s -> !s.getStartTime().isAfter(sT) && !s.getEndTime().isBefore(eT));
    }

    private static boolean overlaps(LocalTime aS, LocalTime aE, LocalTime bS, LocalTime bE) {
        return aS.isBefore(bE) && aE.isAfter(bS);
    }
}
