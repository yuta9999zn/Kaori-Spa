package vn.kaori.spa.booking.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.*;
import vn.kaori.spa.booking.domain.Repositories.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Availability search — given a service + window + branch, return open slots
 * including which beds and which qualified staff could take it.
 *
 * Algorithm (intentionally simple, optimised later):
 *   1. Snap requested window to slot grid (default 30 min).
 *   2. List active beds in branch.
 *   3. List staff in branch with the matching skill (if any registered).
 *   4. Pull all active booking_items in the window.
 *   5. For each candidate slot start:
 *        - For each bed: free if no overlap.
 *        - Pick a free + qualified staff (prefer least-loaded).
 *   6. Return slot suggestions.
 */
@RestController
@RequestMapping("/v1/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final RoomRepository roomRepo;
    private final BedRepository bedRepo;
    private final StaffRepository staffRepo;
    private final StaffSkillRepository skillRepo;
    private final BookingItemRepository itemRepo;

    public record SlotSuggestion(
            Instant startAt,
            Instant endAt,
            UUID bedId,
            String bedCode,
            UUID roomId,
            String roomCode,
            UUID staffId,
            String staffName
    ) {}

    @GetMapping("/search")
    public ApiResponse<List<SlotSuggestion>> search(
            @RequestParam UUID tenantId,
            @RequestParam UUID branchId,
            @RequestParam String serviceCode,
            @RequestParam int durationMin,
            @RequestParam Instant from,
            @RequestParam Instant to,
            @RequestParam(defaultValue = "30") int slotGridMin,
            @RequestParam(defaultValue = "20") int limit
    ) {
        if (durationMin <= 0 || from.isAfter(to)) return ApiResponse.ok(List.of());

        List<Bed> beds = bedRepo.findAllByTenantIdAndBranchIdAndStatus(tenantId, branchId, "active");
        if (beds.isEmpty()) return ApiResponse.ok(List.of());

        Map<UUID, Room> rooms = roomRepo.findAllByTenantIdAndBranchIdAndActiveTrue(tenantId, branchId)
                .stream().collect(Collectors.toMap(Room::getId, r -> r));

        List<Staff> activeStaff = staffRepo.findAllByTenantIdAndBranchIdAndActiveTrue(tenantId, branchId);
        Map<UUID, Staff> staffById = activeStaff.stream().collect(Collectors.toMap(Staff::getId, s -> s));

        Set<UUID> qualifiedStaffIds = skillRepo.findByBranchAndService(branchId, serviceCode)
                .stream().map(s -> s.getId().getStaffId()).collect(Collectors.toSet());
        if (qualifiedStaffIds.isEmpty()) {
            // No skill configured for this service → any active staff considered qualified.
            qualifiedStaffIds = staffById.keySet();
        }

        // Active items in window.
        var occupied = itemRepo.findBranchActiveInWindow(branchId, from, to);

        Duration step = Duration.ofMinutes(slotGridMin);
        Duration dur = Duration.ofMinutes(durationMin);

        List<SlotSuggestion> out = new ArrayList<>();
        for (Instant t = snap(from, slotGridMin); t.plus(dur).compareTo(to) <= 0; t = t.plus(step)) {
            Instant slotEnd = t.plus(dur);

            for (Bed bed : beds) {
                boolean bedFree = occupied.stream().noneMatch(o ->
                        o.getBedId().equals(bed.getId())
                                && overlaps(o.getStartAt(), o.getEndAt(), t, slotEnd));
                if (!bedFree) continue;

                UUID pickedStaff = null;
                String staffName = null;
                for (UUID sid : qualifiedStaffIds) {
                    final Instant st = t;
                    boolean busy = occupied.stream().anyMatch(o ->
                            sid.equals(o.getStaffId())
                                    && overlaps(o.getStartAt(), o.getEndAt(), st, slotEnd));
                    if (!busy) {
                        pickedStaff = sid;
                        staffName = staffById.get(sid) == null ? null : staffById.get(sid).getFullName();
                        break;
                    }
                }
                // If no staff qualified → still surface the bed slot, frontend
                // can decide whether to allow walk-in / unassigned booking.

                Room r = rooms.get(bed.getRoomId());
                out.add(new SlotSuggestion(
                        t, slotEnd, bed.getId(), bed.getCode(),
                        r == null ? null : r.getId(),
                        r == null ? null : r.getCode(),
                        pickedStaff, staffName
                ));
                if (out.size() >= limit) return ApiResponse.ok(out);
            }
        }
        return ApiResponse.ok(out);
    }

    private static Instant snap(Instant t, int gridMin) {
        ZonedDateTime z = t.atZone(ZoneOffset.UTC);
        int m = z.getMinute();
        int rounded = ((m + gridMin - 1) / gridMin) * gridMin;
        return z.withMinute(0).withSecond(0).withNano(0).plusMinutes(rounded).toInstant();
    }

    private static boolean overlaps(Instant aStart, Instant aEnd, Instant bStart, Instant bEnd) {
        return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
    }
}
