package vn.kaori.spa.notification.webhook;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Tenant-admin CRUD for outbound webhooks. Listing also returns last 10
 * deliveries per webhook (for the inspector UI).
 */
@RestController
@RequestMapping("/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    @PersistenceContext
    private EntityManager em;

    private final SecureRandom rng = new SecureRandom();

    public record WebhookDto(UUID id, String name, String targetUrl,
                             List<String> eventFilters, boolean active,
                             Instant createdAt) {}

    public record CreateReq(
            @NotNull UUID tenantId,
            @NotBlank String name,
            @NotBlank String targetUrl,
            @NotNull List<String> eventFilters
    ) {}

    public record DeliveryRow(UUID id, String topic, String status,
                              int attempt, Integer lastStatusCode,
                              Instant createdAt, Instant deliveredAt) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<WebhookDto>> list(@RequestParam UUID tenantId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, name, target_url, event_filters, is_active, created_at
            FROM notification.webhooks
            WHERE tenant_id = :tid
            ORDER BY created_at DESC
            """)
            .setParameter("tid", tenantId)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new WebhookDto(
                (UUID) r[0], (String) r[1], (String) r[2],
                List.of((String[]) r[3]),
                (Boolean) r[4],
                ((java.sql.Timestamp) r[5]).toInstant()
        )).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER')")
    @Audited(action = "webhook.create", entityType = "webhook", entityIdExpression = "#req.name")
    @Transactional
    public ApiResponse<WebhookDto> create(@Valid @RequestBody CreateReq req) {
        UUID id = UUID.randomUUID();
        String secret = generateSecret();
        em.createNativeQuery("""
            INSERT INTO notification.webhooks (id, tenant_id, name, target_url, secret, event_filters)
            VALUES (:id, :tid, :name, :url, :secret, :filters)
            """)
            .setParameter("id", id)
            .setParameter("tid", req.tenantId())
            .setParameter("name", req.name())
            .setParameter("url", req.targetUrl())
            .setParameter("secret", secret)
            .setParameter("filters", req.eventFilters().toArray(new String[0]))
            .executeUpdate();

        return ApiResponse.ok(new WebhookDto(id, req.name(), req.targetUrl(),
                req.eventFilters(), true, Instant.now()));
    }

    @PostMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER')")
    @Audited(action = "webhook.toggle", entityType = "webhook", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> toggle(@PathVariable UUID id) {
        em.createNativeQuery("UPDATE notification.webhooks SET is_active = NOT is_active WHERE id = :id")
            .setParameter("id", id)
            .executeUpdate();
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}/deliveries")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER')")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<DeliveryRow>> deliveries(@PathVariable UUID id) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, event_topic, status, attempt, last_status_code, created_at, delivered_at
            FROM notification.webhook_deliveries
            WHERE webhook_id = :wid
            ORDER BY created_at DESC
            LIMIT 50
            """)
            .setParameter("wid", id)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new DeliveryRow(
                (UUID) r[0], (String) r[1], (String) r[2],
                ((Number) r[3]).intValue(),
                r[4] == null ? null : ((Number) r[4]).intValue(),
                ((java.sql.Timestamp) r[5]).toInstant(),
                r[6] == null ? null : ((java.sql.Timestamp) r[6]).toInstant()
        )).toList());
    }

    private String generateSecret() {
        byte[] buf = new byte[32];
        rng.nextBytes(buf);
        return "whsec_" + Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
