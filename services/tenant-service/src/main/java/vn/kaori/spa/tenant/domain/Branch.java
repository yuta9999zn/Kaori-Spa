package vn.kaori.spa.tenant.domain;

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
@Table(name = "branches", schema = "tenant")
@Getter @Setter
@NoArgsConstructor
public class Branch {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "org_id", nullable = false, updatable = false)
    private UUID orgId;

    @Column(nullable = false)
    private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> address = new HashMap<>();

    @Column
    private String phone;

    @Column
    private BigDecimal lat;

    @Column
    private BigDecimal lng;

    @Column(nullable = false)
    private String timezone = "Asia/Ho_Chi_Minh";

    @Column(name = "directions_url")
    private String directionsUrl;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
