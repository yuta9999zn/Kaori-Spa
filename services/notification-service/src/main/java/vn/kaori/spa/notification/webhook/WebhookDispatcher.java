package vn.kaori.spa.notification.webhook;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Webhook fan-out — listens to every Kaori domain event topic, finds active
 * subscribers whose `event_filters` match, queues a delivery row, and runs
 * a scheduled retry loop with exponential backoff.
 *
 * Signing: each request includes
 *   X-Kaori-Signature: sha256=<hex(hmac_sha256(secret, body))>
 *   X-Kaori-Topic:     kaori.booking.created.v1
 *   X-Kaori-Delivery:  <delivery uuid>
 *
 * Retry schedule: 30s, 2m, 10m, 1h, 6h. After 5 attempts → status=failed,
 * admins must manually re-queue from the UI.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDispatcher {

    private static final long[] BACKOFF_SECONDS = { 30, 120, 600, 3600, 21600 };

    @PersistenceContext
    private EntityManager em;

    private final RestClient http = RestClient.builder()
            .defaultHeader("User-Agent", "Kaori-Webhook/1.0")
            .build();

    @KafkaListener(
            topicPattern = "kaori\\..*",
            groupId = "webhook-dispatcher"
    )
    @Transactional
    public void onEvent(String topic, String payload) {
        // Pull active webhooks whose filters cover this topic.
        var webhooks = matchingWebhooks(topic);
        if (webhooks.isEmpty()) return;

        for (Object[] w : webhooks) {
            UUID webhookId = (UUID) w[0];
            em.createNativeQuery("""
                INSERT INTO notification.webhook_deliveries
                  (webhook_id, event_topic, payload, next_retry_at)
                VALUES (:wid, :topic, :payload::jsonb, now())
                """)
                .setParameter("wid", webhookId)
                .setParameter("topic", topic)
                .setParameter("payload", payload)
                .executeUpdate();
        }
    }

    /** Run every 10s — pick up any delivery whose retry window has arrived. */
    @Scheduled(fixedDelay = 10_000)
    @Transactional
    @SuppressWarnings("unchecked")
    public void drain() {
        List<Object[]> due = (List<Object[]>) em.createNativeQuery("""
            SELECT d.id, d.webhook_id, d.event_topic, d.payload::text, d.attempt,
                   w.target_url, w.secret, w.headers::text
            FROM notification.webhook_deliveries d
            JOIN notification.webhooks w ON w.id = d.webhook_id
            WHERE d.status IN ('pending', 'retrying')
              AND d.next_retry_at <= now()
              AND w.is_active = TRUE
            ORDER BY d.next_retry_at
            LIMIT 50
            """)
            .getResultList();

        for (Object o : due) {
            Object[] r = (Object[]) o;
            UUID id        = (UUID) r[0];
            String url     = (String) r[5];
            String secret  = (String) r[6];
            String topic   = (String) r[2];
            String payload = (String) r[3];
            int attempt    = ((Number) r[4]).intValue();

            try {
                String sig = "sha256=" + hmacHex(secret, payload);
                var resp = http.post()
                        .uri(url)
                        .header("Content-Type", "application/json")
                        .header("X-Kaori-Signature", sig)
                        .header("X-Kaori-Topic", topic)
                        .header("X-Kaori-Delivery", id.toString())
                        .body(payload)
                        .retrieve()
                        .toBodilessEntity();
                int code = resp.getStatusCode().value();
                if (code >= 200 && code < 300) {
                    em.createNativeQuery("""
                        UPDATE notification.webhook_deliveries
                        SET status='succeeded', delivered_at=now(),
                            last_status_code=:code, attempt=attempt + 1
                        WHERE id=:id
                        """)
                        .setParameter("code", code)
                        .setParameter("id", id)
                        .executeUpdate();
                    continue;
                }
                throw new RuntimeException("HTTP " + code);
            } catch (Exception ex) {
                int next = attempt + 1;
                Instant retryAt = next < BACKOFF_SECONDS.length
                        ? Instant.now().plusSeconds(BACKOFF_SECONDS[next])
                        : null;
                String status = retryAt == null ? "failed" : "retrying";
                em.createNativeQuery("""
                    UPDATE notification.webhook_deliveries
                    SET status = :status,
                        attempt = :next,
                        last_response = :err,
                        next_retry_at = :retry
                    WHERE id = :id
                    """)
                    .setParameter("status", status)
                    .setParameter("next", next)
                    .setParameter("err", truncate(ex.getMessage(), 1000))
                    .setParameter("retry", retryAt)
                    .setParameter("id", id)
                    .executeUpdate();
                log.warn("webhook {} delivery {} failed (attempt {}): {}", url, id, next, ex.getMessage());
            }
        }
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> matchingWebhooks(String topic) {
        return (List<Object[]>) em.createNativeQuery("""
            SELECT id, target_url
            FROM notification.webhooks
            WHERE is_active = TRUE
              AND ( '*' = ANY(event_filters)
                 OR :topic = ANY(event_filters)
                 OR EXISTS (
                      SELECT 1 FROM unnest(event_filters) f
                      WHERE :topic LIKE replace(f, '*', '%')))
            """)
            .setParameter("topic", topic)
            .getResultList();
    }

    private static String hmacHex(String secret, String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("hmac failed", ex);
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
