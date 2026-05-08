package vn.kaori.spa.booking.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "staff", schema = "booking")
@Getter @Setter @NoArgsConstructor
public class Staff {
    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(name = "user_id") private UUID userId;
    @Column(nullable = false) private String code;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column private String nickname;
    @Column private String gender;
    @Column(name = "role_in_branch", nullable = false) private String roleInBranch = "THERAPIST";
    @Column(name = "avatar_url") private String avatarUrl;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "hire_date") private LocalDate hireDate;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
