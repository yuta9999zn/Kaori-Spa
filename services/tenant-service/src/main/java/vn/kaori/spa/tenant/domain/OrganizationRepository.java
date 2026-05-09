package vn.kaori.spa.tenant.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findAllByTenantId(UUID tenantId);
    Optional<Organization> findByTenantIdAndCode(UUID tenantId, String code);
    Optional<Organization> findBySlug(String slug);

    /**
     * Paged search for tenant-admin /v1/orgs. Optional {@code q} is matched
     * against {@code code} or {@code slug} (case-insensitive LIKE) — the JSON
     * {@code name} map is not searchable through plain JPQL, callers needing
     * name-search should switch to JdbcTemplate later.
     */
    @Query("""
        SELECT o FROM Organization o
        WHERE o.tenantId = :tenantId
          AND (:q IS NULL
               OR LOWER(o.code) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(o.slug) LIKE LOWER(CONCAT('%', :q, '%')))
    """)
    Page<Organization> findPaged(@Param("tenantId") UUID tenantId,
                                 @Param("q") String q,
                                 Pageable pageable);
}
