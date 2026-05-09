package vn.kaori.spa.tenant.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BranchRepository extends JpaRepository<Branch, UUID> {
    List<Branch> findAllByTenantIdAndOrgId(UUID tenantId, UUID orgId);
    Optional<Branch> findByTenantIdAndOrgIdAndCode(UUID tenantId, UUID orgId, String code);

    /**
     * Paged search for branches under an org. Optional {@code q} is a
     * case-insensitive LIKE against {@code code} or {@code phone} — JSON
     * {@code name}/{@code address} require JdbcTemplate which we skip here.
     */
    @Query("""
        SELECT b FROM Branch b
        WHERE b.tenantId = :tenantId
          AND b.orgId = :orgId
          AND (:q IS NULL
               OR LOWER(b.code) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(b.phone, '')) LIKE LOWER(CONCAT('%', :q, '%')))
    """)
    Page<Branch> findPaged(@Param("tenantId") UUID tenantId,
                           @Param("orgId") UUID orgId,
                           @Param("q") String q,
                           Pageable pageable);
}
