package vn.kaori.spa.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    List<Role> findAllByTenantId(UUID tenantId);

    List<Role> findAllByTenantIdAndScope(UUID tenantId, String scope);

    Optional<Role> findByTenantIdAndCode(UUID tenantId, String code);

    Optional<Role> findByIdAndTenantId(UUID id, UUID tenantId);
}
