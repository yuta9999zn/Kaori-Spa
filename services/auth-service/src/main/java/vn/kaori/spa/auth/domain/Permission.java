package vn.kaori.spa.auth.domain;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Catalog of permissions. Globally scoped (no tenant_id) — every tenant sees the same
 * permission codes and grants them to its own roles via {@link RolePermission}.
 *
 * <p>Note: the {@code group} column maps to a Java reserved word, so the field is named
 * {@code groupName} and the column name is set explicitly.
 */
@Entity
@Table(name = "permissions", schema = "auth")
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class Permission {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> name = new HashMap<>();

    @Column(name = "\"group\"", nullable = false)
    private String groupName;
}
