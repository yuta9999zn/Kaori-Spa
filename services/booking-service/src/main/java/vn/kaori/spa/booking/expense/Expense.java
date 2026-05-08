package vn.kaori.spa.booking.expense;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Operational expense entry recorded against a branch (rent, supplies,
 * salary, …). Aggregated by {@code ReportController#expenses} for the
 * branch-admin P&amp;L view.
 */
@Entity
@Table(name = "expense", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Expense {

    public enum Category {
        towels, supplies, rent, marketing, other, utilities, salary
    }

    @Id @GeneratedValue private UUID id;

    @Column(name = "tenant_id", nullable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false) private UUID branchId;

    @Column(name = "occurred_at", nullable = false) private Instant occurredAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Category category;

    @Column(nullable = false) private BigDecimal amount = BigDecimal.ZERO;

    @Column private String note;

    @Column(name = "created_by") private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
