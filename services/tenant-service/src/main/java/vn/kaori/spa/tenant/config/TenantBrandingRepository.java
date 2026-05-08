package vn.kaori.spa.tenant.config;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TenantBrandingRepository extends JpaRepository<TenantBranding, UUID> {
}
