package vn.kaori.spa.auth.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Caffeine-backed local cache for the RBAC hot path.
 *
 * <p>Two named caches:
 * <ul>
 *   <li>{@code userAccess} — keyed by {@code userId}, stores
 *       {@link vn.kaori.spa.auth.rbac.UserAccessResolver.AccessProfile}. Hit on
 *       every JWT issue / refresh, so a 5-minute TTL is the main lever.</li>
 *   <li>{@code rolePermissions} — keyed by {@code roleId}, stores the resolved
 *       permission codes for a role. Lower-volume but useful for admin screens.</li>
 * </ul>
 *
 * <p>Trade-off: role / user-role changes take up to 5 minutes to fully propagate
 * across instances if eviction is missed. Eviction is wired explicitly on the
 * write paths (see {@link vn.kaori.spa.auth.rbac.RoleService} and
 * {@link vn.kaori.spa.auth.api.UserRoleController}). This is a single-node
 * Caffeine cache; Redis L2 is deferred to Round 8.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String USER_ACCESS = "userAccess";
    public static final String ROLE_PERMISSIONS = "rolePermissions";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager(USER_ACCESS, ROLE_PERMISSIONS);
        mgr.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(5))
                .maximumSize(10_000)
                .recordStats());
        return mgr;
    }
}
