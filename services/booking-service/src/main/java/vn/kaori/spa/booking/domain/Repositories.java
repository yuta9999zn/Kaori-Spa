package vn.kaori.spa.booking.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * One file groups all booking-context repositories so the package surface
 * stays small. Split when any repo gets non-trivial.
 */
public final class Repositories {

    private Repositories() {}

    public interface RoomRepository extends JpaRepository<Room, UUID> {
        List<Room> findAllByTenantIdAndBranchIdAndActiveTrue(UUID tenantId, UUID branchId);
        Optional<Room> findByBranchIdAndCode(UUID branchId, String code);
    }

    public interface BedRepository extends JpaRepository<Bed, UUID> {
        List<Bed> findAllByTenantIdAndBranchIdAndStatus(UUID tenantId, UUID branchId, String status);
        List<Bed> findAllByRoomId(UUID roomId);
    }

    public interface StaffRepository extends JpaRepository<Staff, UUID> {
        List<Staff> findAllByTenantIdAndBranchIdAndActiveTrue(UUID tenantId, UUID branchId);
        Optional<Staff> findByBranchIdAndCode(UUID branchId, String code);
    }

    public interface StaffShiftRepository extends JpaRepository<StaffShift, UUID> {
        @Query("SELECT s FROM StaffShift s WHERE s.staffId = :staffId AND s.workDate = :date")
        List<StaffShift> findByStaffAndDate(@Param("staffId") UUID staffId,
                                            @Param("date") java.time.LocalDate date);

        @Query("SELECT s FROM StaffShift s WHERE s.branchId = :branchId AND s.workDate = :date")
        List<StaffShift> findByBranchAndDate(@Param("branchId") UUID branchId,
                                             @Param("date") java.time.LocalDate date);
    }

    public interface StaffSkillRepository extends JpaRepository<StaffSkill, StaffSkill.Id> {
        @Query("SELECT s FROM StaffSkill s WHERE s.id.serviceCode = :serviceCode " +
               "AND s.id.staffId IN (SELECT st.id FROM Staff st WHERE st.branchId = :branchId AND st.active = true)")
        List<StaffSkill> findByBranchAndService(@Param("branchId") UUID branchId,
                                                @Param("serviceCode") String serviceCode);
    }

    public interface BookingRepository extends JpaRepository<Booking, UUID> {
        Optional<Booking> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);
        List<Booking> findAllByBranchIdAndStartAtBetween(UUID branchId, Instant from, Instant to);
        Optional<Booking> findByTenantIdAndCode(UUID tenantId, String code);
    }

    public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
        Optional<Attendance> findByStaffIdAndWorkDate(UUID staffId, java.time.LocalDate workDate);
        List<Attendance> findAllByBranchIdAndWorkDate(UUID branchId, java.time.LocalDate workDate);
    }

    public interface BookingItemRepository extends JpaRepository<BookingItem, UUID> {
        List<BookingItem> findAllByBookingId(UUID bookingId);

        /**
         * Active items overlapping a window for a specific bed. Used as the
         * application-layer pre-check before INSERT (the DB exclusion still
         * enforces correctness on race).
         */
        @Query("""
            SELECT i FROM BookingItem i
            WHERE i.bedId = :bedId
              AND i.cancelledAt IS NULL
              AND i.status NOT IN ('cancelled', 'no_show')
              AND i.startAt < :end
              AND i.endAt > :start
        """)
        List<BookingItem> findBedOverlap(@Param("bedId") UUID bedId,
                                         @Param("start") Instant start,
                                         @Param("end") Instant end);

        @Query("""
            SELECT i FROM BookingItem i
            WHERE i.staffId = :staffId
              AND i.cancelledAt IS NULL
              AND i.status NOT IN ('cancelled', 'no_show')
              AND i.startAt < :end
              AND i.endAt > :start
        """)
        List<BookingItem> findStaffOverlap(@Param("staffId") UUID staffId,
                                           @Param("start") Instant start,
                                           @Param("end") Instant end);

        @Query("""
            SELECT i FROM BookingItem i
            WHERE i.branchId = :branchId
              AND i.cancelledAt IS NULL
              AND i.status NOT IN ('cancelled', 'no_show')
              AND i.startAt < :end
              AND i.endAt > :start
        """)
        List<BookingItem> findBranchActiveInWindow(@Param("branchId") UUID branchId,
                                                   @Param("start") Instant start,
                                                   @Param("end") Instant end);
    }
}
