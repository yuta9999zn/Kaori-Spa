package vn.kaori.spa.tenant.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BranchRepository extends JpaRepository<Branch, UUID> {
    List<Branch> findAllByTenantIdAndOrgId(UUID tenantId, UUID orgId);
    Optional<Branch> findByTenantIdAndOrgIdAndCode(UUID tenantId, UUID orgId, String code);
}
