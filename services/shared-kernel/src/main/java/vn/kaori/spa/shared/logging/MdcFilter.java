package vn.kaori.spa.shared.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.kaori.spa.shared.security.TenantContext;

import java.io.IOException;
import java.util.UUID;

/**
 * Stamps each request with correlation IDs (traceId, requestId, method, path)
 * into the SLF4J {@link MDC} so every log line emitted while serving the
 * request carries the same context. The {@code X-Trace-Id} request header is
 * honoured if present (allowing edge / API gateway to propagate a trace),
 * otherwise a fresh UUID is generated. The chosen traceId is echoed back in
 * the response header so clients (and other services) can correlate.
 *
 * <p>Runs at {@link Ordered#HIGHEST_PRECEDENCE} + 50 — earlier than
 * {@code RateLimitFilter} (+100) and the JWT auth filter, so MDC is set up
 * before any other filter logs. Tenant / user fields are populated by the
 * JWT auth filter once it has parsed the token (it calls
 * {@link MdcFilter#stampPrincipal()} after {@link TenantContext#set}).
 *
 * <p><b>Thread safety:</b> MDC is per-thread; this filter clears it in
 * {@code finally} so slots leased to a thread pool worker can never leak
 * into the next request handled on the same thread.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class MdcFilter extends OncePerRequestFilter {

    public static final String MDC_TRACE_ID = "traceId";
    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_METHOD = "method";
    public static final String MDC_PATH = "path";
    public static final String MDC_TENANT_ID = "tenantId";
    public static final String MDC_USER_ID = "userId";

    private static final String TRACE_HEADER = "X-Trace-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String traceId = req.getHeader(TRACE_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }
        String requestId = UUID.randomUUID().toString();

        try {
            MDC.put(MDC_TRACE_ID, traceId);
            MDC.put(MDC_REQUEST_ID, requestId);
            MDC.put(MDC_METHOD, req.getMethod());
            MDC.put(MDC_PATH, req.getRequestURI());

            // Best-effort: if the auth filter already populated TenantContext
            // (e.g. when an upstream filter ran first), copy now. The auth
            // filter should also call stampPrincipal() after TenantContext.set
            // so that downstream logs see tenant/user even though MdcFilter
            // sits *before* the auth filter in the chain.
            stampPrincipal();

            res.setHeader(TRACE_HEADER, traceId);

            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }

    /**
     * Copy {@code tenantId} and {@code userId} from the current
     * {@link TenantContext} into the MDC. Safe to call multiple times.
     * Intended to be invoked from the JWT auth filter immediately after
     * {@code TenantContext.set(...)}.
     */
    public static void stampPrincipal() {
        TenantContext.Principal p = TenantContext.get();
        if (p == null) return;
        if (p.tenantId() != null) MDC.put(MDC_TENANT_ID, p.tenantId().toString());
        if (p.userId() != null) MDC.put(MDC_USER_ID, p.userId().toString());
    }
}
