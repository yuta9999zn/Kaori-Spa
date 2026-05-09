package vn.kaori.spa.auth.jwt;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.kaori.spa.shared.logging.MdcFilter;
import vn.kaori.spa.shared.security.TenantContext;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parse(token);
                UUID userId   = UUID.fromString(claims.getSubject());
                UUID tenantId = UUID.fromString(claims.get("tid", String.class));
                UUID orgId    = parseOptUuid(claims.get("oid", String.class));
                UUID branchId = parseOptUuid(claims.get("bid", String.class));
                String locale = claims.get("loc", String.class);

                Set<String> roles = new HashSet<>(claims.get("roles", List.class));
                Set<String> perms = new HashSet<>(claims.get("perms", List.class));

                TenantContext.set(new TenantContext.Principal(
                        tenantId, orgId, branchId, userId, locale, roles, perms
                ));
                // Surface tenant / user IDs into the SLF4J MDC so every log
                // line emitted while handling this request is tagged with them.
                MdcFilter.stampPrincipal();

                var authorities = roles.stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .toList();
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(userId, null, authorities)
                );
            } catch (Exception ignored) {
                // Token invalid → leave anonymous; downstream secured endpoints will 401.
            }
        }

        try {
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private static UUID parseOptUuid(String s) {
        return s == null || s.isBlank() ? null : UUID.fromString(s);
    }
}
