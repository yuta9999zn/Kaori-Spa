package vn.kaori.spa.notification.domain;

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
@Table(name = "notifications", schema = "notification")
@Getter @Setter @NoArgsConstructor
public class Notification {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id") private UUID branchId;
    @Column(name = "user_id", nullable = false, updatable = false) private UUID userId;
    @Column(nullable = false) private String kind;
    @Column(nullable = false) private String title;
    @Column private String body;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payload = new HashMap<>();

    @Column(nullable = false) private String severity = "info";
    @Column(name = "read_at") private Instant readAt;
    @Column(name = "archived_at") private Instant archivedAt;
    @Column(name = "deep_link") private String deepLink;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    public boolean isUnread() { return readAt == null && archivedAt == null; }
}
