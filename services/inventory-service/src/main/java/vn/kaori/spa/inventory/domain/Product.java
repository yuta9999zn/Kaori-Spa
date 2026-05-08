package vn.kaori.spa.inventory.domain;

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
@Table(name = "products", schema = "inventory")
@Getter @Setter @NoArgsConstructor
public class Product {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "org_id", nullable = false, updatable = false) private UUID orgId;
    @Column(nullable = false) private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Column private String sku;
    @Column(nullable = false) private String unit = "pcs";
    @Column(name = "base_price", nullable = false) private BigDecimal basePrice = BigDecimal.ZERO;
    @Column(nullable = false) private String currency = "VND";
    @Column private String category;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
