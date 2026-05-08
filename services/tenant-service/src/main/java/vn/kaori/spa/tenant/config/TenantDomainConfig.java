package vn.kaori.spa.tenant.config;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-tenant domain & SSL configuration. One row per tenant, keyed by tenant_id.
 * Backed by V4__tenant_config.sql.
 */
@Entity
@Table(name = "tenant_domain_config", schema = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class TenantDomainConfig {

    @Id
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 63)
    private String subdomain;

    @Column(name = "custom_domain", length = 253)
    private String customDomain;

    @Column(name = "ssl_status", nullable = false, length = 16)
    private String sslStatus = "pending";

    @Column(name = "ssl_expires_at")
    private Instant sslExpiresAt;

    @Column(name = "force_https", nullable = false)
    private boolean forceHttps = true;

    @Column(name = "redirect_old_url", nullable = false)
    private boolean redirectOldUrl = true;

    @Column(name = "require_login", nullable = false)
    private boolean requireLogin = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
