package vn.kaori.spa.tenant.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Feature flag toggle for one (tenant, module) pair. Composite primary key via
 * {@link FeatureFlagId}. Module keys are well-known strings (booking, services,
 * crm, staff, reports, blog, marketing, inventory, recruitment, ai, analytics,
 * multiloc) seeded by V4__tenant_config.sql.
 */
@Entity
@Table(name = "tenant_feature_flag", schema = "tenant")
@IdClass(TenantFeatureFlag.FeatureFlagId.class)
@Getter
@Setter
@NoArgsConstructor
public class TenantFeatureFlag {

    @Id
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Id
    @Column(name = "module_key", nullable = false, updatable = false, length = 48)
    private String moduleKey;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "is_premium", nullable = false)
    private boolean premium = false;

    @Column(nullable = false)
    private boolean configured = false;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public static class FeatureFlagId implements Serializable {
        private UUID tenantId;
        private String moduleKey;

        public FeatureFlagId() {}
        public FeatureFlagId(UUID tenantId, String moduleKey) {
            this.tenantId = tenantId;
            this.moduleKey = moduleKey;
        }
        public UUID getTenantId() { return tenantId; }
        public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
        public String getModuleKey() { return moduleKey; }
        public void setModuleKey(String moduleKey) { this.moduleKey = moduleKey; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof FeatureFlagId that)) return false;
            return Objects.equals(tenantId, that.tenantId)
                    && Objects.equals(moduleKey, that.moduleKey);
        }
        @Override
        public int hashCode() { return Objects.hash(tenantId, moduleKey); }
    }
}
