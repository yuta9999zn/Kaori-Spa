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
@Table(name = "attendance_records", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Attendance {

    public enum Status { scheduled, present, late, absent, early_out, off, no_shift }

    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(name = "staff_id", nullable = false, updatable = false) private UUID staffId;
    @Column(name = "work_date", nullable = false) private LocalDate workDate;
    @Column(name = "shift_id") private UUID shiftId;
    @Column(name = "expected_start") private LocalTime expectedStart;
    @Column(name = "expected_end") private LocalTime expectedEnd;
    @Column(name = "actual_in") private Instant actualIn;
    @Column(name = "actual_out") private Instant actualOut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.scheduled;

    @Column(name = "minutes_worked") private Integer minutesWorked;
    @Column(name = "minutes_late") private Integer minutesLate;
    @Column private String note;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
