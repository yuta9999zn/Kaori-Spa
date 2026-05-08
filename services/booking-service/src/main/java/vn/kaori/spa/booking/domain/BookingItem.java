package vn.kaori.spa.booking.domain;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "booking_items", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class BookingItem {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(name = "booking_id", nullable = false, updatable = false) private UUID bookingId;
    @Column(name = "service_code", nullable = false) private String serviceCode;

    @Type(JsonType.class)
    @Column(name = "service_name", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> serviceName = new HashMap<>();

    @Column(name = "bed_id", nullable = false) private UUID bedId;
    @Column(name = "room_id", nullable = false) private UUID roomId;
    @Column(name = "staff_id") private UUID staffId;
    @Column(name = "start_at", nullable = false) private Instant startAt;
    @Column(name = "end_at", nullable = false) private Instant endAt;
    @Column(name = "duration_min", nullable = false) private int durationMin;
    @Column(nullable = false) private BigDecimal price = BigDecimal.ZERO;
    @Column(nullable = false) private String status = "pending";
    @Column(name = "cancelled_at") private Instant cancelledAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
