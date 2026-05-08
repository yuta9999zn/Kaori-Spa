package vn.kaori.spa.auth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_2fa", schema = "auth")
@Getter @Setter @NoArgsConstructor
public class User2fa {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private boolean enabled = false;

    /** JSON array string of one-time backup codes. */
    @Column(name = "backup_codes", columnDefinition = "jsonb", nullable = false)
    private String backupCodes = "[]";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public User2fa(UUID userId, String secret) {
        this.userId = userId;
        this.secret = secret;
    }
}
