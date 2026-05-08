package vn.kaori.spa.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermission.Id> {

    @Query("SELECT rp FROM RolePermission rp WHERE rp.id.roleId = :roleId")
    List<RolePermission> findAllByRoleId(@Param("roleId") UUID roleId);

    @Query("SELECT rp FROM RolePermission rp WHERE rp.id.roleId IN :roleIds")
    List<RolePermission> findAllByRoleIdIn(@Param("roleIds") List<UUID> roleIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM RolePermission rp WHERE rp.id.roleId = :roleId")
    void deleteByRoleId(@Param("roleId") UUID roleId);
}
