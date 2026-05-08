package vn.kaori.spa.notification.reminder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import vn.kaori.spa.notification.sender.SmsSender;
import vn.kaori.spa.notification.template.TemplateRenderer;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;

/**
 * Consumes the `notification.send.v1` topic that ReminderScheduler in
 * booking-service writes to. Resolves the locale-aware template, renders
 * placeholders, and dispatches via the active SmsSender (Twilio in prod,
 * Stub in dev).
 *
 * Templates expected for templateKind values:
 *   confirmation            → booking.confirmation
 *   confirmation_imminent   → booking.confirmation_imminent
 *   reminder_h24            → booking.reminder_h24
 *   reminder_h1             → booking.reminder_h1
 *
 * Idempotency lives on the producer side (booking.reminder_log table) so
 * this consumer can stay lean — it just renders & sends.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderConsumer {

    private final ObjectMapper mapper = new ObjectMapper();
    private final TemplateRenderer templateRenderer;
    private final SmsSender smsSender;

    @KafkaListener(
            topics = "${kaori.reminders.topic:notification.send.v1}",
            groupId = "notification-service-reminders",
            concurrency = "2"
    )
    public void onSend(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            String channel       = node.path("channel").asText("sms");
            String to            = node.path("to").asText(null);
            String locale        = node.path("locale").asText("vi");
            String templateKind  = node.path("templateKind").asText(null);
            String tenantIdRaw   = node.path("tenantId").asText(null);
            UUID tenantId        = tenantIdRaw == null ? null : UUID.fromString(tenantIdRaw);

            if (to == null || templateKind == null) {
                log.warn("notification.send.v1 missing 'to' or 'templateKind': {}", payload);
                return;
            }
            if (!"sms".equals(channel)) {
                log.debug("Skipping non-SMS reminder channel={}", channel);
                return;
            }

            Map<String, Object> vars = extractVars(node.path("vars"));
            String code = "booking." + templateKind;
            var rendered = templateRenderer.render(tenantId, code, "sms", locale, vars);
            if (rendered.body() == null || rendered.body().isBlank()) {
                log.warn("No template found for code={} locale={} — reminder skipped", code, locale);
                return;
            }

            String sid = smsSender.send(to, rendered.body());
            log.info("Reminder sent kind={} locale={} provider={} sid={}",
                    templateKind, locale, smsSender.name(), sid);
        } catch (Exception ex) {
            log.error("Failed to handle notification.send.v1: {}", payload, ex);
        }
    }

    private Map<String, Object> extractVars(JsonNode varsNode) {
        Map<String, Object> map = new HashMap<>();
        if (varsNode == null || varsNode.isMissingNode() || !varsNode.isObject()) return map;
        Iterator<Map.Entry<String, JsonNode>> it = varsNode.fields();
        while (it.hasNext()) {
            var e = it.next();
            map.put(e.getKey(), e.getValue().asText(""));
        }
        return map;
    }
}
