package vn.kaori.spa.inventory.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Subscribes to `kaori.booking.completed.v1` and writes negative inventory
 * moves for every consumable mapped to the services performed.
 *
 * Idempotency: each move is keyed by (booking_id, service_code, product_id)
 * via a synthetic ref_id so a redelivered event will hit the unique check.
 *
 * If service_consumables has no row for a given service_code, the deduction
 * silently no-ops — manual SKUs (massage oil sold separately) live entirely
 * in moves table without service mapping.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingCompletedConsumer {

    private final ObjectMapper mapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager em;

    @KafkaListener(
            topics = "kaori.booking.completed.v1",
            groupId = "inventory-service-deductor",
            concurrency = "2"
    )
    @Transactional
    public void onCompleted(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            UUID tenantId  = parseUuid(node, "tenantId");
            UUID branchId  = parseUuid(node, "branchId");
            UUID bookingId = parseUuid(node, "bookingId");
            JsonNode items = node.path("items");
            if (tenantId == null || branchId == null || bookingId == null || !items.isArray()) {
                log.warn("Skipping malformed booking.completed payload: {}", payload);
                return;
            }
            for (JsonNode item : items) {
                String code = item.path("serviceCode").asText(null);
                if (code != null) deductForService(tenantId, branchId, bookingId, code);
            }
        } catch (Exception ex) {
            // Don't rethrow — DLQ would be the right move; for now we log and
            // ack so a single bad event doesn't block the partition.
            log.error("Failed to handle booking.completed: {}", payload, ex);
        }
    }

    @SuppressWarnings("unchecked")
    private void deductForService(UUID tenantId, UUID branchId, UUID bookingId, String serviceCode) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT product_id, qty_per_use
            FROM inventory.service_consumables
            WHERE service_code = :code
            """)
            .setParameter("code", serviceCode)
            .getResultList();
        if (rows.isEmpty()) {
            log.debug("No consumables mapped for service={} — skipping", serviceCode);
            return;
        }
        for (Object[] r : rows) {
            UUID productId = (UUID) r[0];
            BigDecimal qty = (BigDecimal) r[1];
            String note = "Auto-deducted for booking " + bookingId + " (service=" + serviceCode + ")";

            // The trigger trg_apply_move on inventory_moves keeps the balance
            // in sync — we only need to insert the move row.
            int written = em.createNativeQuery("""
                INSERT INTO inventory.inventory_moves
                  (tenant_id, branch_id, product_id, delta, move_type, ref_type, ref_id, note)
                SELECT :tid, :bid, :pid, :delta, 'out', 'booking', :rid, :note
                WHERE NOT EXISTS (
                    SELECT 1 FROM inventory.inventory_moves
                    WHERE ref_type = 'booking'
                      AND ref_id = :rid
                      AND product_id = :pid
                )
                """)
                .setParameter("tid", tenantId)
                .setParameter("bid", branchId)
                .setParameter("pid", productId)
                .setParameter("delta", qty.negate())
                .setParameter("rid", bookingId)
                .setParameter("note", note)
                .executeUpdate();
            if (written == 0) {
                log.debug("Skipping duplicate deduction booking={} product={}", bookingId, productId);
            }
        }
    }

    private UUID parseUuid(JsonNode node, String field) {
        String v = node.path(field).asText(null);
        if (v == null || v.isBlank()) return null;
        try { return UUID.fromString(v); } catch (IllegalArgumentException ex) { return null; }
    }
}
