package vn.kaori.spa.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndEmailAndDeletedAtIsNull(UUID tenantId, String email);

    Optional<User> findByTenantIdAndPhoneAndDeletedAtIsNull(UUID tenantId, String phone);

    /**
     * Stamp last_login without loading the User entity. Called from
     * SessionService on every initial login (not on rotate).
     */
    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :ts WHERE u.id = :id")
    void touchLastLogin(@Param("id") UUID id, @Param("ts") Instant ts);
}
