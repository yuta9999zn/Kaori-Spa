package vn.kaori.spa.shared.security;

import java.util.Set;
import java.util.UUID;

/**
 * Per-request tenant + identity context, populated by AuthFilter from JWT.
 * Stored in ThreadLocal for use by repositories, services, audit aspect.
 */
public final class TenantContext {

    public record Principal(
            UUID tenantId,
            UUID orgId,
            UUID branchId,
            UUID userId,
            String locale,
            Set<String> roles,
            Set<String> permissions
    ) {}

    private static final ThreadLocal<Principal> CURRENT = new ThreadLocal<>();

    public static void set(Principal p) { CURRENT.set(p); }
    public static Principal get() { return CURRENT.get(); }
    public static void clear() { CURRENT.remove(); }

    public static UUID requireTenantId() {
        Principal p = CURRENT.get();
        if (p == null || p.tenantId() == null) {
            throw new IllegalStateException("Tenant context not set");
        }
        return p.tenantId();
    }

    private TenantContext() {}
}
