package vn.kaori.spa.tenant.onboarding;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Tracks a tenant's progress through the onboarding wizard
 * (welcome -> org -> branch -> team -> done). One row per tenant.
 *
 * Both {@code completedSteps} (List&lt;String&gt;) and {@code metadata}
 * (Map&lt;String,Object&gt;) are stored as JSONB using hypersistence-utils,
 * mirroring the pattern in {@link vn.kaori.spa.tenant.config.TenantBranding}.
 */
@Entity
@Table(name = "tenant_onboarding", schema = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class TenantOnboarding {

    @Id
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "current_step", nullable = false, length = 32)
    private String currentStep = "welcome";

    @Type(JsonType.class)
    @Column(name = "completed_steps", columnDefinition = "jsonb", nullable = false)
    private List<String> completedSteps = new ArrayList<>();

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Type(JsonType.class)
    @Column(name = "metadata", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> metadata = new HashMap<>();
}
