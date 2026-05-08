package vn.kaori.spa.tenant.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findAllByTenantId(UUID tenantId);
    Optional<Organization> findByTenantIdAndCode(UUID tenantId, String code);
    Optional<Organization> findBySlug(String slug);
}
