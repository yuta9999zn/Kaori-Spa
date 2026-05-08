package vn.kaori.spa.booking.payroll;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "salary_records", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class SalaryRecord {

    public enum Status { open, locked, paid }

    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false) private UUID branchId;
    @Column(name = "staff_id", nullable = false) private UUID staffId;
    @Column(nullable = false) private String period;        // YYYY-MM
    @Column(name = "base_salary",      nullable = false) private BigDecimal baseSalary = BigDecimal.ZERO;
    @Column(name = "commission_total", nullable = false) private BigDecimal commissionTotal = BigDecimal.ZERO;
    @Column(nullable = false) private BigDecimal bonus = BigDecimal.ZERO;
    @Column(nullable = false) private BigDecimal deduction = BigDecimal.ZERO;
    @Column(name = "days_worked",     nullable = false) private int daysWorked = 0;
    @Column(name = "days_off",        nullable = false) private int daysOff = 0;
    @Column(name = "days_late",       nullable = false) private int daysLate = 0;
    @Column(name = "minutes_worked",  nullable = false) private int minutesWorked = 0;
    @Column(nullable = false) private BigDecimal net = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.open;

    @Column(name = "locked_at") private Instant lockedAt;
    @Column(name = "locked_by") private UUID lockedBy;
    @Column(name = "paid_at")   private Instant paidAt;
    @Column private String note;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
