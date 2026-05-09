package vn.kaori.spa.notification.inbox;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-user inbox notification. Stored in {@code notification.inbox_notification}.
 * Severity is a constrained vocabulary (info/warning/error/success) used by the
 * branch-admin notification center UI to colour the badges.
 */
@Entity
@Table(name = "inbox_notification", schema = "notification")
@Getter @Setter @NoArgsConstructor
public class InboxNotification {

    public enum Severity {
        info, warning, error, success
    }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(nullable = false, length = 48)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Severity severity = Severity.info;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 512)
    private String link;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
