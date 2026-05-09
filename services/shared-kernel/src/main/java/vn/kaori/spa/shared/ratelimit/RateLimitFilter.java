package vn.kaori.spa.shared.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.kaori.spa.shared.security.TenantContext;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-tenant write-endpoint rate limiter using Bucket4j (in-memory).
 *
 * <p>Limits applied per tenant on POST/PUT/PATCH/DELETE methods:
 * <ul>
 *   <li>300 writes / minute (sustained)</li>
 *   <li>20 writes / second (burst)</li>
 * </ul>
 *
 * <p>Throttled responses return HTTP 429 with a {@code Retry-After} header
 * (seconds until next refill) and a JSON envelope matching {@code ApiResponse}.
 *
 * <p>Runs at {@link Ordered#HIGHEST_PRECEDENCE} + 100 so it sees the
 * {@link TenantContext} populated by the auth filter. Requests with no tenant
 * (e.g. unauthenticated public endpoints) are passed through unthrottled —
 * the auth filter will already have rejected anything that requires auth.
 *
 * <p>TODO (Round 8): replace in-memory ConcurrentHashMap with a Redis-backed
 * distributed bucket so the limit is enforced cluster-wide rather than
 * per-instance. Also TODO: switch to a size-bounded Caffeine cache to evict
 * idle tenant buckets — for now the worst case (~10k tenants) is acceptable.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 100)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final ConcurrentHashMap<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        // Only throttle write methods — reads are cheap and shouldn't be limited here.
        if (!WRITE_METHODS.contains(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        TenantContext.Principal principal = TenantContext.get();
        UUID tenantId = principal == null ? null : principal.tenantId();
        if (tenantId == null) {
            // No tenant context — auth filter will have already gated anything sensitive.
            chain.doFilter(req, res);
            return;
        }

        Bucket bucket = buckets.computeIfAbsent(tenantId, k -> Bucket.builder()
                .addLimit(Bandwidth.simple(300, Duration.ofMinutes(1)))   // 300 writes / min / tenant
                .addLimit(Bandwidth.simple(20, Duration.ofSeconds(1)))    // burst 20 / sec
                .build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            res.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(req, res);
        } else {
            long waitSec = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
            res.setStatus(429);
            res.setHeader("Retry-After", String.valueOf(waitSec));
            res.setHeader("X-RateLimit-Remaining", "0");
            res.setContentType("application/json");
            res.getWriter().write(
                    "{\"success\":false,\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests\"}}"
            );
        }
    }
}
