package vn.kaori.spa.catalog.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceRepository extends JpaRepository<Service, UUID> {
    List<Service> findAllByOrgIdAndActiveTrue(UUID orgId);
    Optional<Service> findByOrgIdAndCode(UUID orgId, String code);

    @Query("SELECT s FROM Service s WHERE s.orgId = :orgId AND s.active = true " +
           "AND (:gender IS NULL OR s.gender = :gender) " +
           "AND (:region IS NULL OR s.region = :region) " +
           "AND (:combo IS NULL OR s.combo = :combo) " +
           "ORDER BY s.sortOrder, s.code")
    List<Service> search(@Param("orgId") UUID orgId,
                         @Param("gender") String gender,
                         @Param("region") String region,
                         @Param("combo") Boolean combo);
}
