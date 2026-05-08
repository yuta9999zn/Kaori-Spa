package vn.kaori.spa.shared.outbox;

import java.util.List;

/**
 * Service-specific outbox store. Each microservice that uses the outbox
 * pattern provides a Spring bean implementing this interface.
 */
public interface OutboxEventStore {
    List<? extends OutboxEvent> fetchUnpublished(int limit);
    void save(OutboxEvent event);
}
