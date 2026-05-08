package vn.kaori.spa.tenant.audit;

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
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Postgres mirror of an audit event published by {@code AuditAspect} to
 * Kafka topic {@code kaori.audit.event.v1}. Used by the tenant-admin
 * audit log read endpoint. Writes happen best-effort from the aspect, so
 * this table may have gaps if the DB was unavailable when an event fired.
 */
@Entity
@Table(name = "audit_event", schema = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class AuditEvent {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Instant ts;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(nullable = false, length = 96)
    private String action;

    @Column(name = "entity_type", length = 48)
    private String entityType;

    @Column(name = "entity_id", length = 96)
    private String entityId;

    @Column(length = 64)
    private String ip;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload = new HashMap<>();
}
