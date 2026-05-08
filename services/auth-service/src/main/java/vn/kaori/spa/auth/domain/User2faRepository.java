package vn.kaori.spa.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface User2faRepository extends JpaRepository<User2fa, UUID> {
}
