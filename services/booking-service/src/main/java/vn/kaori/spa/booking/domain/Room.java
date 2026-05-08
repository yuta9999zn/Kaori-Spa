package vn.kaori.spa.booking.domain;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "rooms", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Room {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(nullable = false) private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Column(name = "room_type", nullable = false) private String roomType = "normal";
    @Column private Integer floor;
    @Column(name = "capacity_beds", nullable = false) private int capacityBeds = 1;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
