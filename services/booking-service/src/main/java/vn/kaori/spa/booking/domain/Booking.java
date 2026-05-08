package vn.kaori.spa.booking.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Booking {

    public enum Status { pending, confirmed, in_progress, done, cancelled, no_show }
    public enum Source { web, walkin, phone, ai, admin, partner }

    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(nullable = false, updatable = false) private String code;

    @Column(name = "customer_id") private UUID customerId;
    @Column(name = "customer_name", nullable = false) private String customerName;
    @Column(name = "customer_phone", nullable = false) private String customerPhone;
    @Column(name = "customer_email") private String customerEmail;

    @Column(nullable = false) private String locale = "vi";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.pending;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source = Source.web;

    @Column(name = "start_at", nullable = false) private Instant startAt;
    @Column(name = "end_at", nullable = false) private Instant endAt;

    @Column(name = "total_amount", nullable = false) private BigDecimal totalAmount = BigDecimal.ZERO;
    @Column(nullable = false) private String currency = "VND";

    @Column private String note;
    @Column(name = "idempotency_key") private String idempotencyKey;

    // BookingItem references this via `bookingId`. Fetch through repository
    // to keep transactional boundaries explicit.

    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @Column(name = "cancelled_by") private UUID cancelledBy;
    @Column(name = "cancel_reason") private String cancelReason;
}
