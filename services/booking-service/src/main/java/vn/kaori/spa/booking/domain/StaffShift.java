package vn.kaori.spa.booking.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "staff_shifts", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class StaffShift {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(name = "staff_id", nullable = false, updatable = false) private UUID staffId;
    @Column(name = "work_date", nullable = false) private LocalDate workDate;
    @Column(name = "start_time", nullable = false) private LocalTime startTime;
    @Column(name = "end_time", nullable = false) private LocalTime endTime;
    @Column(name = "is_off", nullable = false) private boolean off = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false)
    private ShiftType shiftType = ShiftType.FULL;

    @Column private String note;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
