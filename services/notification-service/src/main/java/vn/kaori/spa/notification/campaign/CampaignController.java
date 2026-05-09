package vn.kaori.spa.notification.campaign;

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

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    @PersistenceContext
    private EntityManager em;

    public record CampaignDto(UUID id, String name, String channel, String templateCode,
                              String status, Instant scheduledAt,
                              int totalRecipients, int sentCount, int failedCount,
                              Instant createdAt) {}

    public record CreateReq(
            @NotNull UUID tenantId,
            @NotBlank String name,
            @NotBlank String channel,            // sms | email | inapp | push
            @NotBlank String templateCode,
            Map<String, Object> segmentFilter,    // { segment: 'vip' } etc
            @NotNull Instant scheduledAt
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER','MARKETING')")
    @SuppressWarnings("unchecked")
    // TODO(round-8): paginate. Cap to 200 so an old tenant cannot OOM us.
    public ApiResponse<List<CampaignDto>> list(@RequestParam UUID tenantId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, name, channel, template_code, status, scheduled_at,
                   total_recipients, sent_count, failed_count, created_at
            FROM notification.campaigns
            WHERE tenant_id = :tid
            ORDER BY created_at DESC
            LIMIT 200
            """)
            .setParameter("tid", tenantId)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new CampaignDto(
                (UUID) r[0], (String) r[1], (String) r[2], (String) r[3], (String) r[4],
                r[5] == null ? null : ((java.sql.Timestamp) r[5]).toInstant(),
                ((Number) r[6]).intValue(),
                ((Number) r[7]).intValue(),
                ((Number) r[8]).intValue(),
                ((java.sql.Timestamp) r[9]).toInstant()
        )).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER','MARKETING')")
    @Audited(action = "campaign.create", entityType = "campaign", entityIdExpression = "#req.name")
    @Transactional
    public ApiResponse<UUID> create(@Valid @RequestBody CreateReq req) {
        UUID id = UUID.randomUUID();
        String filterJson;
        try {
            filterJson = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(req.segmentFilter() == null ? Map.of() : req.segmentFilter());
        } catch (Exception ex) {
            filterJson = "{}";
        }
        em.createNativeQuery("""
            INSERT INTO notification.campaigns
              (id, tenant_id, name, channel, template_code, segment_filter, scheduled_at, status)
            VALUES (:id, :tid, :name, :channel, :tpl, :seg::jsonb, :at, 'scheduled')
            """)
            .setParameter("id", id)
            .setParameter("tid", req.tenantId())
            .setParameter("name", req.name())
            .setParameter("channel", req.channel())
            .setParameter("tpl", req.templateCode())
            .setParameter("seg", filterJson)
            .setParameter("at", req.scheduledAt())
            .executeUpdate();
        return ApiResponse.ok(id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','ORG_OWNER','MARKETING')")
    @Audited(action = "campaign.cancel", entityType = "campaign", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> cancel(@PathVariable UUID id) {
        em.createNativeQuery("""
            UPDATE notification.campaigns
            SET status = 'cancelled', finished_at = now()
            WHERE id = :id AND status IN ('draft', 'scheduled', 'running')
            """)
            .setParameter("id", id)
            .executeUpdate();
        return ApiResponse.ok(null);
    }
}
