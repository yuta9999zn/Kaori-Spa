package vn.kaori.spa.shared.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.UUID;

/**
 * Sets the Postgres session GUC `app.tenant_id` to match the JWT-derived
 * TenantContext on every HTTP request. Postgres RLS policies read the GUC
 * via current_tenant() — without this interceptor, RLS will block all
 * queries because the tenant filter resolves to NULL.
 *
 * Public endpoints (no JWT) leave the GUC unset; their queries fall back
 * to permissive policies or run against tables without RLS.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class TenantSessionInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        TenantContext.Principal p = TenantContext.get();
        UUID tid = p == null ? null : p.tenantId();
        if (tid != null) {
            // SET LOCAL only persists for the current transaction. Spring's
            // OpenSessionInView is disabled, so a per-request transaction
            // boundary is what carries the GUC for the request's queries.
            em.createNativeQuery("SELECT set_config('app.tenant_id', :tid, true)")
                    .setParameter("tid", tid.toString())
                    .getSingleResult();
        }
        return true;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this);
    }
}
