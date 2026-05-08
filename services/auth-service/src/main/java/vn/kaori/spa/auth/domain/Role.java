package vn.kaori.spa.auth.domain;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * RBAC role. Tenant-scoped: each tenant has its own role catalog. The {@code scope}
 * column ('tenant' / 'org' / 'branch') describes at what level a role can be assigned
 * to a user; {@code is_system} flags built-in roles (e.g. TENANT_OWNER, ORG_OWNER)
 * that must not be deleted.
 */
@Entity
@Table(name = "roles", schema = "auth")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class Role {

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
    private String scope;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
