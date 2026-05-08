package vn.kaori.spa.notification.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Subscribes to booking events and dispatches notifications (email / SMS /
 * push / in-app) using locale-aware templates. Idempotency: persist the
 * event id and skip duplicates.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventListener {

    private final ObjectMapper mapper = new ObjectMapper();

    @KafkaListener(
            topics = "kaori.booking.created.v1",
            groupId = "notification-service",
            concurrency = "3"
    )
    public void onBookingCreated(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            String tenantId  = node.path("tenantId").asText();
            String bookingId = node.path("bookingId").asText();
            String customer  = node.path("customer").asText("Khách hàng");
            String locale    = node.path("locale").asText("vi");

            log.info("notify booking.created tenant={} booking={} locale={} customer={}",
                    tenantId, bookingId, locale, customer);
            // TODO M3 follow-up: render template + send via SES / SNS / FCM.
        } catch (Exception ex) {
            log.error("Failed to handle booking.created", ex);
        }
    }
}
