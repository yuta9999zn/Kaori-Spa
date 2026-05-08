package vn.kaori.spa.tenant.config;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantFeatureFlagRepository
        extends JpaRepository<TenantFeatureFlag, TenantFeatureFlag.FeatureFlagId> {

    List<TenantFeatureFlag> findAllByTenantId(UUID tenantId);

    Optional<TenantFeatureFlag> findByTenantIdAndModuleKey(UUID tenantId, String moduleKey);
}
