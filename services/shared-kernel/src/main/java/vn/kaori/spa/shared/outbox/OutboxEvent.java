package vn.kaori.spa.shared.outbox;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Transactional outbox row. Produced atomically with the domain change in the
 * same DB transaction; a separate publisher polls and pushes to Kafka with
 * at-least-once semantics. Consumers must be idempotent.
 *
 * Each service that publishes events ships its own copy of this entity in the
 * service-local schema (no global outbox table). The class is reusable to
 * avoid boilerplate.
 */
@MappedSuperclass
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class OutboxEvent {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "topic", nullable = false, updatable = false)
    private String topic;

    @Column(name = "key_value", nullable = false, updatable = false)
    private String key;

    @Column(name = "payload", columnDefinition = "jsonb", nullable = false, updatable = false)
    private String payload;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "last_error", length = 1024)
    private String lastError;

    protected OutboxEvent(UUID tenantId, String topic, String key, String payload) {
        this.tenantId = tenantId;
        this.topic = topic;
        this.key = key;
        this.payload = payload;
    }

    public boolean isPublished() { return publishedAt != null; }
}
