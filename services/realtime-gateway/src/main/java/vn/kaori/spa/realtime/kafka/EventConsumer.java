package vn.kaori.spa.realtime.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import vn.kaori.spa.realtime.ws.RoomRegistry;

/**
 * Consumes Kaori domain events and fans them out to WS rooms.
 *
 * Each event payload must include `tenantId` (and optionally `branchId`,
 * `userId`) so the consumer can derive the target room. Events without a
 * tenant are dropped (defence-in-depth).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumer {

    private final RoomRegistry registry;
    private final ObjectMapper mapper = new ObjectMapper();

    @KafkaListener(
            topics = {
                    "kaori.booking.created.v1",
                    "kaori.booking.updated.v1",
                    "kaori.payment.completed.v1",
                    "kaori.notification.created.v1"
            },
            groupId = "realtime-gateway"
    )
    public void onMessage(String topic, String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            String tid = text(node, "tenantId");
            if (tid == null) {
                log.warn("Drop event from {} — missing tenantId", topic);
                return;
            }

            String room;
            String userId = text(node, "userId");
            String branchId = text(node, "branchId");
            String orgId = text(node, "orgId");

            if (topic.startsWith("kaori.notification.") && userId != null) {
                room = "t:" + tid + ":u:" + userId + ":notifications";
            } else if (branchId != null) {
                room = "t:" + tid + (orgId != null ? ":o:" + orgId : "")
                        + ":b:" + branchId + ":" + topicChannel(topic);
            } else {
                room = "t:" + tid + ":" + topicChannel(topic);
            }
            registry.publish(room, payload);
        } catch (Exception ex) {
            log.error("Failed to process event from {}", topic, ex);
        }
    }

    private static String topicChannel(String topic) {
        // kaori.<context>.<event>.v1 → context
        String[] parts = topic.split("\\.");
        return parts.length > 1 ? parts[1] : "events";
    }

    private static String text(JsonNode n, String f) {
        JsonNode v = n.get(f);
        return v == null || v.isNull() ? null : v.asText();
    }
}
