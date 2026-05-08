package vn.kaori.spa.content.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ContentPostRepository extends JpaRepository<ContentPost, UUID> {

    Page<ContentPost> findAllByTenantIdAndOrgId(UUID tenantId, UUID orgId, Pageable pageable);

    Optional<ContentPost> findByTenantIdAndOrgIdAndSlug(UUID tenantId, UUID orgId, String slug);

    /**
     * Filtered, paginated search. Each filter is optional (pass null to skip).
     * The {@code q} parameter does a case-insensitive match against slug; for
     * title (jsonb) we cast to text and run ILIKE — good enough for an MVP
     * before we wire a tsvector index.
     */
    @Query("""
            SELECT p FROM ContentPost p
            WHERE p.tenantId = :tenantId
              AND p.orgId = :orgId
              AND (:branchId IS NULL OR p.branchId = :branchId)
              AND (:type IS NULL OR p.type = :type)
              AND (:status IS NULL OR p.status = :status)
              AND (:q IS NULL
                   OR LOWER(p.slug) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(CAST(p.title AS string)) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ContentPost> searchPaged(
            @Param("tenantId") UUID tenantId,
            @Param("orgId") UUID orgId,
            @Param("branchId") UUID branchId,
            @Param("type") ContentPost.PostType type,
            @Param("status") ContentPost.Status status,
            @Param("q") String q,
            Pageable pageable
    );

    /**
     * Public listing of published posts for client-web blog index. Scoped by
     * orgId only — the (tenant_id, org_id, slug) unique index plus the org_id
     * uniqueness within tenant-service guarantees no cross-tenant leak.
     */
    @Query("""
            SELECT p FROM ContentPost p
            WHERE p.orgId = :orgId
              AND p.status = vn.kaori.spa.content.domain.ContentPost$Status.published
              AND (:type IS NULL OR p.type = :type)
            """)
    Page<ContentPost> findPublishedByOrg(
            @Param("orgId") UUID orgId,
            @Param("type") ContentPost.PostType type,
            Pageable pageable
    );

    /**
     * Public single-post lookup by org + slug. Returns only published posts.
     */
    @Query("""
            SELECT p FROM ContentPost p
            WHERE p.orgId = :orgId
              AND p.slug = :slug
              AND p.status = vn.kaori.spa.content.domain.ContentPost$Status.published
            """)
    Optional<ContentPost> findPublishedByOrgAndSlug(
            @Param("orgId") UUID orgId,
            @Param("slug") String slug
    );
}
