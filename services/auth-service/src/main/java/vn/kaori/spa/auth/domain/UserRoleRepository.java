package vn.kaori.spa.auth.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRole.Id> {

    List<UserRole> findAllByUserId(UUID userId);

    List<UserRole> findAllByScopeOrgId(UUID scopeOrgId);

    List<UserRole> findAllByScopeBranchId(UUID scopeBranchId);

    @Query("""
        SELECT ur FROM UserRole ur
        WHERE (:userId   IS NULL OR ur.userId = :userId)
          AND (:orgId    IS NULL OR ur.scopeOrgId = :orgId)
          AND (:branchId IS NULL OR ur.scopeBranchId = :branchId)
    """)
    List<UserRole> search(@Param("userId") UUID userId,
                          @Param("orgId") UUID orgId,
                          @Param("branchId") UUID branchId);

    /**
     * Paged variant of {@link #search}. Returns assignments matching all
     * non-null filters. Sorting is the responsibility of the caller via
     * {@link Pageable}.
     */
    @Query("""
        SELECT ur FROM UserRole ur
        WHERE (:userId   IS NULL OR ur.userId = :userId)
          AND (:orgId    IS NULL OR ur.scopeOrgId = :orgId)
          AND (:branchId IS NULL OR ur.scopeBranchId = :branchId)
    """)
    Page<UserRole> searchPaged(@Param("userId") UUID userId,
                               @Param("orgId") UUID orgId,
                               @Param("branchId") UUID branchId,
                               Pageable pageable);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserRole ur WHERE ur.userId = :userId AND ur.roleId = :roleId")
    int deleteByUserIdAndRoleId(@Param("userId") UUID userId, @Param("roleId") UUID roleId);
}
