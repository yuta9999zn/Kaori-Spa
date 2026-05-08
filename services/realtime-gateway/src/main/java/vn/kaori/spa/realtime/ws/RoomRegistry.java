package vn.kaori.spa.realtime.ws;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Holds a {@link Sinks.Many} per room. Kafka consumer pushes events here,
 * connected WebSocket sessions subscribe to the matching room flux.
 *
 * Room naming: t:{tenantId}:o:{orgId}:b:{branchId}:{channel}
 *              t:{tenantId}:u:{userId}:notifications
 */
@Component
public class RoomRegistry {

    private final Map<String, Sinks.Many<String>> rooms = new ConcurrentHashMap<>();

    public Sinks.Many<String> roomSink(String room) {
        return rooms.computeIfAbsent(room,
                k -> Sinks.many().multicast().onBackpressureBuffer(256, false));
    }

    public void publish(String room, String payload) {
        Sinks.Many<String> sink = rooms.get(room);
        if (sink != null) {
            sink.tryEmitNext(payload);
        }
    }

    public int connectionsCount() {
        return rooms.values().stream()
                .mapToInt(s -> s.currentSubscriberCount())
                .sum();
    }
}
