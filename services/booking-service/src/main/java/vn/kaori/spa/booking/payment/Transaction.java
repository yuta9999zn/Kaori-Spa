package vn.kaori.spa.booking.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transactions", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Transaction {

    public enum Type { dv, mp }   // service vs product

    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;

    @Enumerated(EnumType.STRING)
    @Column(name = "txn_type", nullable = false, updatable = false)
    private Type txnType = Type.dv;

    @Column(name = "method_code", nullable = false, updatable = false) private String methodCode;
    @Column(nullable = false, updatable = false) private BigDecimal amount;
    @Column(nullable = false) private String currency = "VND";

    @Column(name = "booking_id") private UUID bookingId;
    @Column(name = "customer_phone") private String customerPhone;
    @Column(name = "customer_name")  private String customerName;
    @Column private String note;
    @Column(name = "actor_id") private UUID actorId;
    @Column(name = "paid_at", nullable = false) private Instant paidAt = Instant.now();
    @Column(name = "refunded_at") private Instant refundedAt;
    @Column(name = "refund_reason") private String refundReason;
    @Column(name = "receipt_no") private String receiptNo;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
