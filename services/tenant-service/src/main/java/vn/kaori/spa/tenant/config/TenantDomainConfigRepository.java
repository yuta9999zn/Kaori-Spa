package vn.kaori.spa.tenant.config;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantDomainConfigRepository extends JpaRepository<TenantDomainConfig, UUID> {
    Optional<TenantDomainConfig> findBySubdomain(String subdomain);
    Optional<TenantDomainConfig> findByCustomDomain(String customDomain);
}
