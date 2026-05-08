package vn.kaori.spa.content.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves an org slug to its {@code orgId} by calling tenant-service's public
 * endpoint. Result is cached in-memory for the JVM lifetime — slugs are
 * effectively immutable.
 *
 * <p>The {@code tenantSlug} path component is currently ignored (tenant-service
 * treats org slugs as globally unique). It remains in the URL for forward
 * compatibility with a future multi-tenant slug namespace.
 *
 * <p>tenant-service URL is read from {@code kaori.services.tenant-url}
 * (default {@code http://localhost:8082}).
 *
 * <p>TODO: cache via Redis populated by tenant-service domain events for
 * production deployments.
 */
@Component
public class OrgResolver {

    private final RestClient client;
    private final ConcurrentHashMap<String, UUID> cache = new ConcurrentHashMap<>();

    public OrgResolver(@Value("${kaori.services.tenant-url:http://localhost:8082}") String tenantUrl) {
        this.client = RestClient.builder().baseUrl(tenantUrl).build();
    }

    @SuppressWarnings("unchecked")
    public UUID resolveOrgId(String tenantSlug, String orgSlug) {
        String key = tenantSlug + "/" + orgSlug;
        UUID cached = cache.get(key);
        if (cached != null) return cached;

        Map<String, Object> data;
        try {
            var resp = client.get()
                    .uri("/v1/public/orgs/{slug}", orgSlug)
                    .retrieve()
                    .body(Map.class);
            data = resp == null ? null : (Map<String, Object>) resp.get("data");
        } catch (Exception ex) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND,
                    "Org not found: " + orgSlug);
        }
        if (data == null || data.get("id") == null) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND,
                    "Org not found: " + orgSlug);
        }
        UUID orgId = UUID.fromString(Objects.toString(data.get("id")));
        cache.put(key, orgId);
        return orgId;
    }
}
