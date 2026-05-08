package vn.kaori.spa.booking;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.kaori.spa.booking.api.BookingService;
import vn.kaori.spa.booking.domain.*;
import vn.kaori.spa.booking.domain.Repositories.BedRepository;
import vn.kaori.spa.booking.domain.Repositories.RoomRepository;
import vn.kaori.spa.booking.domain.Repositories.StaffRepository;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies the DB-level exclusion guards against double-booking the same bed
 * or the same staff for overlapping time windows. The application pre-check
 * also fires; either layer alone catches the race.
 */
class BookingConflictIT extends AbstractBookingIT {

    @Autowired BookingService bookingService;
    @Autowired RoomRepository roomRepo;
    @Autowired BedRepository bedRepo;
    @Autowired StaffRepository staffRepo;

    @Test
    void cannot_book_same_bed_overlapping_window() {
        UUID tenant = UUID.randomUUID();
        UUID branch = UUID.randomUUID();

        Room room = new Room();
        room.setTenantId(tenant); room.setBranchId(branch);
        room.setCode("P1"); room.getName().put("vi", "Phòng 1");
        room = roomRepo.save(room);

        Bed bed = new Bed();
        bed.setTenantId(tenant); bed.setBranchId(branch); bed.setRoomId(room.getId());
        bed.setCode("G1"); bed.getName().put("vi", "Giường 1");
        bed = bedRepo.save(bed);

        Instant start = Instant.now().plus(1, ChronoUnit.HOURS).truncatedTo(ChronoUnit.MINUTES);
        Instant end   = start.plus(60, ChronoUnit.MINUTES);

        bookingService.create(makeCmd(tenant, branch, room.getId(), bed.getId(), null, start, end, "Khách 1"));

        // Overlapping booking on the same bed → must throw BOOKING_SLOT_TAKEN.
        assertThatThrownBy(() ->
                bookingService.create(makeCmd(tenant, branch, room.getId(), bed.getId(), null,
                        start.plus(15, ChronoUnit.MINUTES),
                        end.plus(15, ChronoUnit.MINUTES),
                        "Khách 2"))
        )
        .isInstanceOf(AppException.class)
        .extracting("code")
        .isEqualTo(ErrorCodes.BOOKING_SLOT_TAKEN);
    }

    @Test
    void can_book_back_to_back_on_same_bed() {
        UUID tenant = UUID.randomUUID();
        UUID branch = UUID.randomUUID();

        Room room = new Room();
        room.setTenantId(tenant); room.setBranchId(branch); room.setCode("P2");
        room.getName().put("vi", "Phòng 2");
        room = roomRepo.save(room);

        Bed bed = new Bed();
        bed.setTenantId(tenant); bed.setBranchId(branch); bed.setRoomId(room.getId());
        bed.setCode("G2"); bed.getName().put("vi", "Giường 2");
        bed = bedRepo.save(bed);

        Instant t0 = Instant.now().plus(1, ChronoUnit.HOURS).truncatedTo(ChronoUnit.MINUTES);
        Instant t1 = t0.plus(30, ChronoUnit.MINUTES);
        Instant t2 = t1.plus(30, ChronoUnit.MINUTES);

        bookingService.create(makeCmd(tenant, branch, room.getId(), bed.getId(), null, t0, t1, "Khách A"));
        // Adjacent (t1, t2) should be fine — tstzrange is half-open '[)'.
        var b2 = bookingService.create(makeCmd(tenant, branch, room.getId(), bed.getId(), null, t1, t2, "Khách B"));
        assertThat(b2).isNotNull();
    }

    @Test
    void cannot_double_book_same_staff() {
        UUID tenant = UUID.randomUUID();
        UUID branch = UUID.randomUUID();

        Room room = new Room();
        room.setTenantId(tenant); room.setBranchId(branch); room.setCode("PA");
        room.getName().put("vi", "Phòng A");
        room = roomRepo.save(room);

        Bed bed1 = new Bed();
        bed1.setTenantId(tenant); bed1.setBranchId(branch); bed1.setRoomId(room.getId());
        bed1.setCode("GA1"); bed1.getName().put("vi", "Giường A1");
        bed1 = bedRepo.save(bed1);
        Bed bed2 = new Bed();
        bed2.setTenantId(tenant); bed2.setBranchId(branch); bed2.setRoomId(room.getId());
        bed2.setCode("GA2"); bed2.getName().put("vi", "Giường A2");
        bed2 = bedRepo.save(bed2);

        Staff staff = new Staff();
        staff.setTenantId(tenant); staff.setBranchId(branch);
        staff.setCode("NV-X"); staff.setFullName("Test KTV");
        staff = staffRepo.save(staff);

        Instant start = Instant.now().plus(2, ChronoUnit.HOURS).truncatedTo(ChronoUnit.MINUTES);
        Instant end = start.plus(60, ChronoUnit.MINUTES);

        bookingService.create(makeCmd(tenant, branch, room.getId(), bed1.getId(), staff.getId(), start, end, "C1"));

        // Different bed but SAME staff overlapping → BOOKING_STAFF_BUSY.
        assertThatThrownBy(() ->
                bookingService.create(makeCmd(tenant, branch, room.getId(), bed2.getId(), staff.getId(),
                        start.plus(10, ChronoUnit.MINUTES),
                        end.plus(10, ChronoUnit.MINUTES),
                        "C2"))
        )
        .isInstanceOf(AppException.class)
        .extracting("code")
        .isEqualTo(ErrorCodes.BOOKING_STAFF_BUSY);
    }

    private static BookingService.CreateBookingCmd makeCmd(UUID tenant, UUID branch, UUID room, UUID bed,
                                                          UUID staff, Instant start, Instant end, String customer) {
        return new BookingService.CreateBookingCmd(
                tenant, branch, null, customer, "0901000000", null, "vi",
                Booking.Source.web, null, null, null,
                List.of(new BookingService.ItemCmd(
                        "female_vio_combo",
                        java.util.Map.of("vi", "Triệt VIO Combo"),
                        bed, room, staff, start, end, new BigDecimal("600000")
                ))
        );
    }
}
