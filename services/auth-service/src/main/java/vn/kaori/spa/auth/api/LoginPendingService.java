package vn.kaori.spa.auth.api;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Holds short-lived "password-passed, awaiting OTP" challenges.
 *
 * Stored in-memory for a single instance; production should switch to Redis
 * with a 5-minute TTL so multiple auth-service replicas share state.
 */
@Service
@Slf4j
public class LoginPendingService {

    private static final long TTL_MILLIS = 5 * 60 * 1000;

    private final ConcurrentHashMap<String, Pending> pending = new ConcurrentHashMap<>();
    private final SecureRandom rng = new SecureRandom();

    public record Pending(UUID userId, Instant expiresAt) {
        public boolean isAlive() { return Instant.now().isBefore(expiresAt); }
    }

    public String issue(UUID userId) {
        // Sweep old entries on each issue.
        long now = System.currentTimeMillis();
        pending.entrySet().removeIf(e -> e.getValue().expiresAt().toEpochMilli() < now);

        byte[] buf = new byte[24];
        rng.nextBytes(buf);
        String token = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
        pending.put(token, new Pending(userId,
                Instant.ofEpochMilli(now + TTL_MILLIS)));
        return token;
    }

    public UUID consume(String token) {
        Pending p = pending.remove(token);
        if (p == null || !p.isAlive()) {
            throw new AppException(ErrorCodes.AUTH_TOKEN_EXPIRED,
                    HttpStatus.UNAUTHORIZED, "Pending OTP token expired");
        }
        return p.userId();
    }

    public Map<String, Object> describe() {
        return Map.of("size", pending.size());
    }
}
