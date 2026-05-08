package vn.kaori.spa.auth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Join table between {@link Role} and {@link Permission}. Composite PK (role_id, permission_id).
 */
@Entity
@Table(name = "role_permissions", schema = "auth")
@Getter @Setter @NoArgsConstructor
public class RolePermission {

    @EmbeddedId
    private Id id;

    public RolePermission(UUID roleId, UUID permissionId) {
        this.id = new Id(roleId, permissionId);
    }

    public UUID getRoleId() { return id == null ? null : id.getRoleId(); }
    public UUID getPermissionId() { return id == null ? null : id.getPermissionId(); }

    @Embeddable
    @Getter @Setter @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "role_id") private UUID roleId;
        @Column(name = "permission_id") private UUID permissionId;

        public Id(UUID roleId, UUID permissionId) {
            this.roleId = roleId;
            this.permissionId = permissionId;
        }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id that)) return false;
            return Objects.equals(roleId, that.roleId) && Objects.equals(permissionId, that.permissionId);
        }
        @Override public int hashCode() { return Objects.hash(roleId, permissionId); }
    }
}
