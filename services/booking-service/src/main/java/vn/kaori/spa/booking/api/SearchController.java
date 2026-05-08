package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.util.List;
import java.util.UUID;

/**
 * Global search across customers, bookings and services for the cmd-k
 * palette. Each "kind" is queried independently and combined client-side.
 *
 * Performance: each query has trigram or BTree index, scan is bounded by
 * tenant + branch. For real high-volume tenants this should move to a
 * dedicated search index (Meilisearch / OpenSearch) — for now Postgres
 * trigram performs fine up to a few hundred thousand customers.
 */
@RestController
@RequestMapping("/v1/search")
@RequiredArgsConstructor
public class SearchController {

    @PersistenceContext
    private EntityManager em;

    public record Hit(String kind, String id, String label, String secondary, String href) {}

    @GetMapping
    @SuppressWarnings("unchecked")
    public ApiResponse<List<Hit>> search(@RequestParam UUID tenantId,
                                         @RequestParam UUID branchId,
                                         @RequestParam String q) {
        if (q == null || q.trim().length() < 2) return ApiResponse.ok(List.of());
        String pattern = "%" + q.trim().toLowerCase() + "%";

        List<Hit> out = new java.util.ArrayList<>();

        // ── Customers (cross-schema query) ──
        try {
            List<Object[]> customers = em.createNativeQuery("""
                SELECT id, code, full_name, phone
                FROM customer.customers
                WHERE tenant_id = :tid
                  AND deleted_at IS NULL
                  AND ( unaccent(lower(full_name)) LIKE unaccent(:p)
                     OR phone LIKE :raw
                     OR code  ILIKE :raw )
                LIMIT 5
                """)
                .setParameter("tid", tenantId)
                .setParameter("p", pattern)
                .setParameter("raw", pattern)
                .getResultList();
            for (Object o : customers) {
                Object[] r = (Object[]) o;
                out.add(new Hit("customer", r[0].toString(),
                        (String) r[2],
                        r[1] + " · " + r[3],
                        "/customer/" + r[0]));
            }
        } catch (Exception ex) { /* customer schema may not exist in some tests */ }

        // ── Bookings ──
        List<Object[]> bookings = em.createNativeQuery("""
            SELECT id, code, customer_name, status,
                   to_char(start_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DD/MM HH24:MI') AS time
            FROM booking.bookings
            WHERE branch_id = :bid
              AND ( upper(code) LIKE upper(:raw)
                 OR unaccent(lower(customer_name)) LIKE unaccent(:p)
                 OR customer_phone LIKE :raw )
            ORDER BY start_at DESC
            LIMIT 5
            """)
            .setParameter("bid", branchId)
            .setParameter("p", pattern)
            .setParameter("raw", pattern)
            .getResultList();
        for (Object o : bookings) {
            Object[] r = (Object[]) o;
            out.add(new Hit("booking", r[0].toString(),
                    (String) r[1],
                    r[2] + " · " + r[3] + " · " + r[4],
                    "/booking/" + r[0]));
        }

        // ── Services (catalog) ──
        try {
            List<Object[]> services = em.createNativeQuery("""
                SELECT s.id, s.code, s.name->>'vi' AS label, s.base_price
                FROM catalog.services s
                WHERE s.tenant_id = :tid
                  AND s.is_active = TRUE
                  AND ( upper(s.code) LIKE upper(:raw)
                     OR unaccent(lower(s.name->>'vi')) LIKE unaccent(:p) )
                LIMIT 5
                """)
                .setParameter("tid", tenantId)
                .setParameter("p", pattern)
                .setParameter("raw", pattern)
                .getResultList();
            for (Object o : services) {
                Object[] r = (Object[]) o;
                out.add(new Hit("service", r[0].toString(),
                        (String) r[2],
                        r[1] + " · " + r[3],
                        "/service?code=" + r[1]));
            }
        } catch (Exception ex) { /* catalog schema may not exist */ }

        return ApiResponse.ok(out);
    }
}
