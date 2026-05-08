package vn.kaori.spa.notification.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Bridge: payment.completed → loyalty earn.
 *
 * Why this lives in notification-service: it's already subscribed to the
 * relevant topics and persists side-effects, and we don't want to bloat the
 * payment endpoint with cross-domain calls. A future iteration can move
 * this to a dedicated `loyalty-engine` service when business rules grow.
 *
 * Idempotent: customer-service's `loyalty_transactions` table records the
 * (refType, refId) so a retry produces the same balance.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LoyaltyEarner {

    private final ObjectMapper mapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager em;

    @Value("${kaori.customer-service.url:http://localhost:8087}")
    private String customerServiceUrl;

    private RestClient client() { return RestClient.create(customerServiceUrl); }

    @KafkaListener(topics = "kaori.payment.completed.v1", groupId = "loyalty-earner")
    public void onPayment(String payload) {
        JsonNode n;
        try { n = mapper.readTree(payload); }
        catch (Exception ex) { log.warn("loyalty earner: bad json"); return; }

        String phone   = text(n, "customerPhone");
        if (phone == null) phone = text(n, "phone");
        BigDecimal amt = decimal(n, "amount");
        UUID bookingId = uuid(n, "bookingId");
        UUID tenantId  = uuid(n, "tenantId");
        if (phone == null || amt == null || tenantId == null) {
            log.debug("loyalty earner: missing fields, skipping");
            return;
        }

        UUID customerId = lookupCustomerByPhone(tenantId, phone);
        if (customerId == null) {
            log.debug("loyalty earner: no customer for phone {}", phone);
            return;
        }

        try {
            client().post()
                    .uri("/v1/loyalty/earn")
                    .header("Content-Type", "application/json")
                    .body(Map.of(
                            "customerId", customerId.toString(),
                            "spendAmount", amt.toPlainString(),
                            "refType", "booking",
                            "refId", bookingId == null ? null : bookingId.toString()
                    ))
                    .retrieve()
                    .toBodilessEntity();
            log.info("loyalty earned: customer={} amount={}", customerId, amt);
        } catch (Exception ex) {
            log.warn("loyalty earn call failed: {}", ex.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private UUID lookupCustomerByPhone(UUID tenantId, String phone) {
        try {
            var rows = (List<UUID>) em.createNativeQuery("""
                SELECT id FROM customer.customers
                WHERE tenant_id = :tid AND phone = :phone AND deleted_at IS NULL
                LIMIT 1
                """)
                .setParameter("tid", tenantId)
                .setParameter("phone", phone)
                .getResultList();
            return rows.isEmpty() ? null : rows.get(0);
        } catch (Exception ex) {
            log.warn("customer lookup failed: {}", ex.getMessage());
            return null;
        }
    }

    private static String text(JsonNode n, String f) {
        var v = n.get(f);
        return v == null || v.isNull() ? null : v.asText();
    }
    private static BigDecimal decimal(JsonNode n, String f) {
        String s = text(n, f);
        try { return s == null ? null : new BigDecimal(s); }
        catch (NumberFormatException ex) { return null; }
    }
    private static UUID uuid(JsonNode n, String f) {
        String s = text(n, f);
        try { return s == null || s.isBlank() ? null : UUID.fromString(s); }
        catch (IllegalArgumentException ex) { return null; }
    }
}
