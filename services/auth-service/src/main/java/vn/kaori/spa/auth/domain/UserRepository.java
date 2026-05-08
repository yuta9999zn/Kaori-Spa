package vn.kaori.spa.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndEmailAndDeletedAtIsNull(UUID tenantId, String email);

    Optional<User> findByTenantIdAndPhoneAndDeletedAtIsNull(UUID tenantId, String phone);
}
