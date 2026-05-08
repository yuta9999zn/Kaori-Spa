package vn.kaori.spa.realtime.ws;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Handles ws://gateway/v1/ws?token=...&rooms=...
 *
 * - Validates JWT (same secret as auth-service via shared env).
 * - Verifies the requested rooms are within the principal's tenant scope.
 * - Multiplexes events from {@link RoomRegistry} to the connected client.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RealtimeWebSocketHandler implements WebSocketHandler {

    private final RoomRegistry registry;

    @Value("${kaori.jwt.secret}")
    private String secret;

    @Value("${kaori.jwt.issuer:kaori-auth}")
    private String issuer;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        var query = session.getHandshakeInfo().getUri().getQuery();
        var params = parseQuery(query);
        String token = params.get("token");
        String roomsParam = params.getOrDefault("rooms", "");

        if (token == null || token.isBlank()) {
            return session.close();
        }

        Claims claims;
        try {
            claims = parse(token);
        } catch (Exception ex) {
            log.warn("WS reject: bad token");
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }

        String tid = claims.get("tid", String.class);
        if (tid == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }

        List<String> rooms = List.of(roomsParam.split(",")).stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .filter(r -> r.startsWith("t:" + tid + ":"))
                .toList();

        if (rooms.isEmpty()) {
            return session.send(Flux.just(session.textMessage("ERR no-rooms-allowed")))
                    .then(session.close());
        }

        log.info("WS open tid={} rooms={} sub={}", tid, rooms, claims.getSubject());

        Flux<String> events = Flux.merge(
                rooms.stream().map(r -> registry.roomSink(r).asFlux()).toList()
        );

        Flux<WebSocketMessage> outbound = Flux.<String>concat(
                Flux.just("READY:" + String.join(",", rooms)),
                events
        ).map(session::textMessage);

        // Drop inbound messages for now (read-only stream).
        Mono<Void> inbound = session.receive().doOnNext(WebSocketMessage::getPayloadAsText).then();

        return Mono.when(session.send(outbound), inbound);
    }

    private Claims parse(String token) {
        byte[] keyBytes = secret.length() < 64
                ? secret.getBytes(StandardCharsets.UTF_8)
                : java.util.Base64.getDecoder().decode(secret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes.length >= 32 ? keyBytes : padTo32(keyBytes));
        return Jwts.parser().verifyWith(key).requireIssuer(issuer).build()
                .parseSignedClaims(token).getPayload();
    }

    private static byte[] padTo32(byte[] in) {
        byte[] out = new byte[32];
        System.arraycopy(in, 0, out, 0, Math.min(in.length, 32));
        return out;
    }

    private static java.util.Map<String, String> parseQuery(String q) {
        var map = new java.util.HashMap<String, String>();
        if (q == null) return map;
        for (var pair : q.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0) map.put(pair.substring(0, eq), java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8));
        }
        return map;
    }
}
