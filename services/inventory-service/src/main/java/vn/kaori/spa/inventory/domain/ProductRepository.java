package vn.kaori.spa.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findAllByOrgIdAndActiveTrue(UUID orgId);
    Optional<Product> findByOrgIdAndCode(UUID orgId, String code);
}
