package vn.kaori.spa.shared.outbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Polls outbox events that have not been published, publishes to Kafka,
 * marks them as sent. Runs every 500ms by default; tune via property
 * `kaori.outbox.poll-ms`. Each service registers its own
 * {@link OutboxEventStore} bean to plug into this loop.
 */
@Component
@ConditionalOnBean(OutboxEventStore.class)
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final OutboxEventStore store;

    @Scheduled(fixedDelayString = "${kaori.outbox.poll-ms:500}")
    @Transactional
    public void poll() {
        var batch = store.fetchUnpublished(100);
        if (batch.isEmpty()) return;
        for (var ev : batch) {
            try {
                kafkaTemplate.send(ev.getTopic(), ev.getKey(), ev.getPayload()).get();
                ev.setPublishedAt(Instant.now());
                store.save(ev);
            } catch (Exception ex) {
                ev.setAttempts(ev.getAttempts() + 1);
                ev.setLastError(ex.getMessage() == null ? ex.toString() : ex.getMessage());
                store.save(ev);
                log.warn("outbox publish failed id={} topic={} attempt={}",
                        ev.getId(), ev.getTopic(), ev.getAttempts(), ex);
            }
        }
    }
}
