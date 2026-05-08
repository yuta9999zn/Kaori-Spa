package vn.kaori.spa.notification.campaign;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.notification.sender.EmailSender;
import vn.kaori.spa.notification.sender.SmsSender;
import vn.kaori.spa.notification.template.TemplateRenderer;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Campaign workers — two cron jobs:
 *
 *   resolveDue() — every 30s: for each campaign whose `scheduled_at` ≤ now
 *     and status='scheduled', resolve the segment filter into recipient
 *     rows (`campaign_sends`) and flip status='running'.
 *
 *   drain()      — every 10s: pull pending sends in batches, render the
 *     locale-appropriate template, hand to SmsSender / EmailSender, mark
 *     sent or failed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignService {

    @PersistenceContext
    private EntityManager em;

    private final TemplateRenderer renderer;
    private final SmsSender smsSender;
    private final EmailSender emailSender;

    @Scheduled(fixedDelay = 30_000)
    @Transactional
    @SuppressWarnings("unchecked")
    public void resolveDue() {
        var due = (List<UUID>) em.createNativeQuery("""
            SELECT id FROM notification.campaigns
            WHERE status = 'scheduled' AND scheduled_at <= now()
            ORDER BY scheduled_at ASC
            LIMIT 10
            """).getResultList();
        for (UUID id : due) {
            resolveCampaign(id);
        }
    }

    @SuppressWarnings("unchecked")
    void resolveCampaign(UUID campaignId) {
        var meta = (List<Object[]>) em.createNativeQuery("""
            SELECT tenant_id, channel, template_code, segment_filter::text
            FROM notification.campaigns WHERE id = :id
            """)
            .setParameter("id", campaignId)
            .getResultList();
        if (meta.isEmpty()) return;
        Object[] m = meta.get(0);
        UUID tenantId = (UUID) m[0];
        String channel = (String) m[1];

        // Materialise recipient list. Filter shape kept simple: { segment, branchIds[] }.
        // Production should parse JSON properly — here we rely on PG json operators.
        int created = em.createNativeQuery("""
            INSERT INTO notification.campaign_sends
              (campaign_id, recipient_phone, recipient_email, customer_id, rendered_body, rendered_subject)
            SELECT :cid, c.phone, c.email, c.id, '', NULL
            FROM customer.customers c
            JOIN notification.campaigns cm ON cm.id = :cid
            WHERE c.tenant_id = cm.tenant_id
              AND c.deleted_at IS NULL
              AND ( cm.segment_filter->>'segment' IS NULL
                 OR c.segment = cm.segment_filter->>'segment' )
              AND c.consent_marketing = TRUE
            """)
            .setParameter("cid", campaignId)
            .executeUpdate();

        em.createNativeQuery("""
            UPDATE notification.campaigns
            SET status = 'running', started_at = now(), total_recipients = :n
            WHERE id = :id
            """)
            .setParameter("n", created)
            .setParameter("id", campaignId)
            .executeUpdate();
        log.info("campaign {} resolved with {} recipients (channel={})", campaignId, created, channel);
    }

    @Scheduled(fixedDelay = 10_000)
    @Transactional
    @SuppressWarnings("unchecked")
    public void drain() {
        var batch = (List<Object[]>) em.createNativeQuery("""
            SELECT s.id, s.campaign_id, s.recipient_phone, s.recipient_email,
                   c.channel, c.template_code, c.tenant_id,
                   COALESCE(cu.locale, 'vi') AS locale,
                   cu.full_name
            FROM notification.campaign_sends s
            JOIN notification.campaigns c ON c.id = s.campaign_id
            LEFT JOIN customer.customers cu ON cu.id = s.customer_id
            WHERE s.status = 'pending' AND c.status = 'running'
            ORDER BY s.created_at ASC
            LIMIT 50
            """).getResultList();

        for (Object o : batch) {
            Object[] r = (Object[]) o;
            UUID sendId    = (UUID) r[0];
            UUID campId    = (UUID) r[1];
            String phone   = (String) r[2];
            String email   = (String) r[3];
            String channel = (String) r[4];
            String code    = (String) r[5];
            UUID tenantId  = (UUID) r[6];
            String locale  = (String) r[7];
            String fullName = (String) r[8];

            Map<String, Object> vars = new HashMap<>();
            vars.put("customerName", fullName == null ? "" : fullName);

            try {
                var rendered = renderer.render(tenantId, code, channel, locale, vars);
                String body = rendered.body();
                String subject = rendered.subject();
                String providerId;

                switch (channel) {
                    case "sms" -> {
                        if (phone == null) throw new IllegalStateException("missing phone");
                        providerId = smsSender.send(phone, body);
                    }
                    case "email" -> {
                        if (email == null) throw new IllegalStateException("missing email");
                        providerId = emailSender.send(email, subject == null ? "Natural Beauty" : subject, body);
                    }
                    default -> throw new IllegalStateException("unsupported channel: " + channel);
                }

                em.createNativeQuery("""
                    UPDATE notification.campaign_sends
                    SET status='sent', provider_id=:pid, sent_at=now(),
                        rendered_body=:body, rendered_subject=:subject
                    WHERE id=:id
                    """)
                    .setParameter("pid", providerId)
                    .setParameter("body", body)
                    .setParameter("subject", subject)
                    .setParameter("id", sendId)
                    .executeUpdate();

                em.createNativeQuery("UPDATE notification.campaigns SET sent_count = sent_count + 1 WHERE id = :id")
                    .setParameter("id", campId)
                    .executeUpdate();
            } catch (Exception ex) {
                em.createNativeQuery("""
                    UPDATE notification.campaign_sends
                    SET status='failed', error=:err
                    WHERE id=:id
                    """)
                    .setParameter("err", ex.getMessage() == null ? ex.toString() : ex.getMessage())
                    .setParameter("id", sendId)
                    .executeUpdate();
                em.createNativeQuery("UPDATE notification.campaigns SET failed_count = failed_count + 1 WHERE id = :id")
                    .setParameter("id", campId)
                    .executeUpdate();
                log.warn("campaign send {} failed: {}", sendId, ex.getMessage());
            }
        }

        // Mark campaign done when no pending sends left.
        em.createNativeQuery("""
            UPDATE notification.campaigns SET status='done', finished_at=now()
            WHERE status = 'running'
              AND id NOT IN (SELECT campaign_id FROM notification.campaign_sends WHERE status='pending')
            """).executeUpdate();
    }
}
