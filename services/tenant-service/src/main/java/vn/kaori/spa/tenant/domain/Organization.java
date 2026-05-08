package vn.kaori.spa.tenant.domain;

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
@Table(name = "organizations", schema = "tenant")
@Getter @Setter
@NoArgsConstructor
public class Organization {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Column(nullable = false)
    private String slug;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "primary_locale", nullable = false)
    private String primaryLocale = "vi";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
