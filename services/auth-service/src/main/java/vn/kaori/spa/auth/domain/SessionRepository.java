package vn.kaori.spa.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    Optional<Session> findByRefreshTokenHashAndRevokedAtIsNull(String refreshTokenHash);
}
