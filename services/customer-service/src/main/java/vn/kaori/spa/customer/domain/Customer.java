package vn.kaori.spa.customer.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "customers", schema = "customer")
@Getter @Setter @NoArgsConstructor
public class Customer {

    public enum Segment { new_, regular, vip, dormant }

    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "org_id", nullable = false, updatable = false) private UUID orgId;
    @Column(nullable = false) private String code;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column private String nickname;
    @Column(nullable = false) private String phone;
    @Column private String email;
    @Column private String gender;
    @Column private LocalDate dob;
    @Column(nullable = false) private String locale = "vi";
    @Column(nullable = false) private String nationality = "VN";
    @Column(name = "first_visit_month") private Short firstVisitMonth;

    @Column(nullable = false)
    private String segment = "new";  // store as plain string to match enum-with-keyword

    @Column(nullable = false) private int points = 0;
    @Column(name = "lifetime_spend", nullable = false) private java.math.BigDecimal lifetimeSpend = java.math.BigDecimal.ZERO;
    @Column private String notes;
    @Column private String source;
    @Column(name = "consent_marketing", nullable = false) private boolean consentMarketing = false;

    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    @Column(name = "deleted_at") private Instant deletedAt;
}
