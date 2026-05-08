package vn.kaori.spa.auth.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Read-mostly profile attached to a user. The PK is the user_id (1-1 with users).
 */
@Entity
@Table(name = "user_profiles", schema = "auth")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class UserProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column
    private LocalDate dob;

    @Column
    private String gender;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
