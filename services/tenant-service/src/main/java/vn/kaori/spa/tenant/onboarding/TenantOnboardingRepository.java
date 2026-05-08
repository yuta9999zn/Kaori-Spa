package vn.kaori.spa.tenant.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TenantOnboardingRepository extends JpaRepository<TenantOnboarding, UUID> {
}
