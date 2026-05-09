package vn.kaori.spa.auth.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    List<Role> findAllByTenantId(UUID tenantId);

    List<Role> findAllByTenantIdAndScope(UUID tenantId, String scope);

    Optional<Role> findByTenantIdAndCode(UUID tenantId, String code);

    Optional<Role> findByIdAndTenantId(UUID id, UUID tenantId);

    /**
     * Paged role search. {@code scope} is an exact match when provided;
     * {@code q} matches {@code code} (case-insensitive LIKE).
     */
    @Query("""
        SELECT r FROM Role r
        WHERE r.tenantId = :tenantId
          AND (:scope IS NULL OR r.scope = :scope)
          AND (:q IS NULL OR LOWER(r.code) LIKE LOWER(CONCAT('%', :q, '%')))
    """)
    Page<Role> findPaged(@Param("tenantId") UUID tenantId,
                         @Param("scope") String scope,
                         @Param("q") String q,
                         Pageable pageable);
}
