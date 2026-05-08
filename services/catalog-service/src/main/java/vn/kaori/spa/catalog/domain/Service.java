package vn.kaori.spa.catalog.domain;

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
@Table(name = "services", schema = "catalog")
@Getter @Setter @NoArgsConstructor
public class Service {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "org_id", nullable = false, updatable = false) private UUID orgId;
    @Column(nullable = false) private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> description;

    @Column(name = "category_id") private UUID categoryId;
    @Column(nullable = false) private String gender = "unisex";
    @Column(nullable = false) private String region;
    @Column(name = "duration_min", nullable = false) private int durationMin;
    @Column(name = "base_price", nullable = false) private BigDecimal basePrice;
    @Column(nullable = false) private String currency = "VND";
    @Column(name = "is_combo", nullable = false) private boolean combo = false;
    @Column(nullable = false) private int sessions = 1;
    @Column(name = "uses_wax", nullable = false) private boolean usesWax = false;
    @Column(name = "uses_machine", nullable = false) private boolean usesMachine = true;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "sort_order", nullable = false) private int sortOrder = 0;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
