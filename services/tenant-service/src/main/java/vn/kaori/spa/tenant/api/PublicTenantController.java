package vn.kaori.spa.tenant.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.util.List;
import java.util.Map;

/**
 * Read-only endpoints used by the client website (no auth required).
 * Returns the tenant + its branches by slug.
 */
@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicTenantController {

    @PersistenceContext
    private EntityManager em;

    @GetMapping("/orgs/{slug}")
    @SuppressWarnings("unchecked")
    public ApiResponse<Map<String, Object>> getOrgBySlug(@PathVariable String slug) {
        Object orgRow = em.createNativeQuery(
                "SELECT id, code, name, slug, primary_locale, supported_locales " +
                "FROM tenant.organizations WHERE slug = :slug LIMIT 1"
        ).setParameter("slug", slug).getSingleResult();
        Object[] row = (Object[]) orgRow;

        List<Object[]> branches = em.createNativeQuery(
                "SELECT code, name, address, phone, lat, lng, directions_url " +
                "FROM tenant.branches WHERE org_id = :oid AND is_active = true ORDER BY code"
        ).setParameter("oid", row[0]).getResultList();

        return ApiResponse.ok(Map.of(
                "id", row[0],
                "code", row[1],
                "name", row[2],
                "slug", row[3],
                "primaryLocale", row[4],
                "supportedLocales", row[5],
                "branches", branches.stream().map(b -> Map.of(
                        "code", b[0], "name", b[1], "address", b[2],
                        "phone", b[3], "lat", b[4], "lng", b[5], "directionsUrl", b[6]
                )).toList()
        ));
    }
}
