package vn.kaori.spa.booking.outbox;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import vn.kaori.spa.shared.outbox.OutboxEvent;

import java.util.UUID;

@Entity
@Table(name = "outbox_events", schema = "booking")
public class BookingOutboxEvent extends OutboxEvent {
    protected BookingOutboxEvent() { super(); }
    public BookingOutboxEvent(UUID tenantId, String topic, String key, String payload) {
        super(tenantId, topic, key, payload);
    }
}
