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
@Table(name = "beds", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Bed {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(name = "room_id", nullable = false, updatable = false) private UUID roomId;
    @Column(nullable = false) private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Column(name = "bed_type", nullable = false) private String bedType = "standard";
    @Column(nullable = false) private String status = "active";
    @Column private String notes;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();

    public boolean isUsable() { return "active".equals(status); }
}
