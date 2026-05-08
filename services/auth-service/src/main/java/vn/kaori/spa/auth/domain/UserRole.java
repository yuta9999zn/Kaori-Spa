package vn.kaori.spa.auth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Maps a user to a role with optional org / branch scope. The DB has a unique index on
 * (user_id, role_id, COALESCE(scope_org_id, zero), COALESCE(scope_branch_id, zero)),
 * so the same role can be assigned to a user multiple times only with different scopes.
 *
 * <p>Composite PK is modelled with {@code @IdClass} so that each scope column can hold
 * NULL — {@code @EmbeddedId} would flag NULL fields in the PK.
 */
@Entity
@Table(name = "user_roles", schema = "auth")
@IdClass(UserRole.Id.class)
@Getter @Setter @NoArgsConstructor
public class UserRole {

    @jakarta.persistence.Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @jakarta.persistence.Id
    @Column(name = "role_id", nullable = false, updatable = false)
    private UUID roleId;

    @jakarta.persistence.Id
    @Column(name = "scope_org_id", updatable = false)
    private UUID scopeOrgId;

    @jakarta.persistence.Id
    @Column(name = "scope_branch_id", updatable = false)
    private UUID scopeBranchId;

    @Column(name = "granted_at", nullable = false, updatable = false)
    private Instant grantedAt = Instant.now();

    public UserRole(UUID userId, UUID roleId, UUID scopeOrgId, UUID scopeBranchId) {
        this.userId = userId;
        this.roleId = roleId;
        this.scopeOrgId = scopeOrgId;
        this.scopeBranchId = scopeBranchId;
    }

    public static class Id implements Serializable {
        private UUID userId;
        private UUID roleId;
        private UUID scopeOrgId;
        private UUID scopeBranchId;

        public Id() {}

        public Id(UUID userId, UUID roleId, UUID scopeOrgId, UUID scopeBranchId) {
            this.userId = userId;
            this.roleId = roleId;
            this.scopeOrgId = scopeOrgId;
            this.scopeBranchId = scopeBranchId;
        }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id that)) return false;
            return Objects.equals(userId, that.userId)
                    && Objects.equals(roleId, that.roleId)
                    && Objects.equals(scopeOrgId, that.scopeOrgId)
                    && Objects.equals(scopeBranchId, that.scopeBranchId);
        }

        @Override public int hashCode() {
            return Objects.hash(userId, roleId, scopeOrgId, scopeBranchId);
        }
    }
}
