package vn.kaori.spa.customer.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByOrgIdAndPhoneAndDeletedAtIsNull(UUID orgId, String phone);
    Optional<Customer> findByOrgIdAndCode(UUID orgId, String code);

    @Query(value = """
        SELECT * FROM customer.customers c
        WHERE c.org_id = :orgId
          AND c.deleted_at IS NULL
          AND ( :q = ''
                OR (unaccent(lower(c.full_name)) || ' ' || c.phone) ILIKE '%' || unaccent(lower(:q)) || '%' )
        ORDER BY c.updated_at DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM customer.customers c
        WHERE c.org_id = :orgId
          AND c.deleted_at IS NULL
          AND ( :q = ''
                OR (unaccent(lower(c.full_name)) || ' ' || c.phone) ILIKE '%' || unaccent(lower(:q)) || '%' )
        """,
        nativeQuery = true)
    Page<Customer> search(@Param("orgId") UUID orgId,
                          @Param("q") String q,
                          Pageable pageable);
}
