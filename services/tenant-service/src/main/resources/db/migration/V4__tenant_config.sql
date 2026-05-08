-- Tenant-level platform configuration: domain, branding, feature flags.
--
-- Three single-row-per-tenant tables (plus one row-per-(tenant,module) for flags)
-- back the tenant-admin "Platform Config" page. They live in the tenant schema
-- because they are tenant-scoped configuration of the platform itself, parallel
-- to the existing tenants/organizations/branches catalog.
--
-- Why JSONB for some text fields:
--   login_welcome / booking_tagline / email_footer are user-facing copy that
--   must be localized across {vi, en, ja, zh, ko}. We store the full map per
--   field rather than a separate i18n table since these are always loaded
--   together with branding.

SET search_path TO tenant;

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE tenant_domain_config (
    tenant_id        UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    subdomain        VARCHAR(63) NOT NULL,
    custom_domain    VARCHAR(253),
    ssl_status       VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (ssl_status IN ('pending','active','failed')),
    ssl_expires_at   TIMESTAMPTZ,
    force_https      BOOLEAN NOT NULL DEFAULT TRUE,
    redirect_old_url BOOLEAN NOT NULL DEFAULT TRUE,
    require_login    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_tenant_domain_subdomain ON tenant_domain_config (subdomain);
CREATE UNIQUE INDEX uniq_tenant_domain_custom
    ON tenant_domain_config (custom_domain)
    WHERE custom_domain IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE tenant_branding (
    tenant_id        UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url         TEXT,
    favicon_url      TEXT,
    primary_color    VARCHAR(16) NOT NULL DEFAULT '#C9A87C',
    secondary_color  VARCHAR(16) NOT NULL DEFAULT '#D9B8B5',
    accent_color     VARCHAR(16) NOT NULL DEFAULT '#DCD6DD',
    background_color VARCHAR(16) NOT NULL DEFAULT '#F4EFEA',
    heading_font     VARCHAR(64) NOT NULL DEFAULT 'Playfair Display',
    body_font        VARCHAR(64) NOT NULL DEFAULT 'Inter',
    login_welcome    JSONB,                    -- {"vi":"...","en":"..."}
    booking_tagline  JSONB,
    email_logo_url   TEXT,
    email_header_bg  VARCHAR(16),
    email_footer     JSONB,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────
-- One row per (tenant, module). module_key is one of the platform's
-- known modules (booking, services, crm, ...). is_premium flags modules
-- that require a higher plan tier; activated_at records when it was first
-- turned on for that tenant (for trial/billing tracking).
CREATE TABLE tenant_feature_flag (
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_key   VARCHAR(48) NOT NULL,
    enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    is_premium   BOOLEAN NOT NULL DEFAULT FALSE,
    configured   BOOLEAN NOT NULL DEFAULT FALSE,
    activated_at TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, module_key)
);
CREATE INDEX idx_tenant_feature_flag_module ON tenant_feature_flag (module_key);

-- ────────────────────────────────────────────────────────────────────────
-- Seed: backfill defaults for every existing tenant.
-- The tenants table uses `code` (no `slug` column); we use it as the
-- subdomain prefix. In practice the org slug is what the public-facing
-- URL uses, but the tenant code is unique per tenant and is a safe initial
-- value the admin can override.
INSERT INTO tenant_domain_config (tenant_id, subdomain)
SELECT t.id, t.code
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_domain_config d WHERE d.tenant_id = t.id
);

INSERT INTO tenant_branding (tenant_id)
SELECT t.id
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_branding b WHERE b.tenant_id = t.id
);

-- Seed the 12 known modules. Core ones default-on, premium ones default-off.
INSERT INTO tenant_feature_flag (tenant_id, module_key, enabled, is_premium, activated_at)
SELECT t.id, m.module_key, m.enabled, m.is_premium,
       CASE WHEN m.enabled THEN now() ELSE NULL END
FROM tenants t
CROSS JOIN (VALUES
    ('booking',     TRUE,  FALSE),
    ('services',    TRUE,  FALSE),
    ('crm',         TRUE,  FALSE),
    ('staff',       TRUE,  FALSE),
    ('reports',     TRUE,  FALSE),
    ('blog',        TRUE,  FALSE),
    ('marketing',   FALSE, FALSE),
    ('inventory',   TRUE,  FALSE),
    ('recruitment', FALSE, FALSE),
    ('ai',          FALSE, TRUE),
    ('analytics',   FALSE, TRUE),
    ('multiloc',    FALSE, TRUE)
) AS m(module_key, enabled, is_premium)
ON CONFLICT (tenant_id, module_key) DO NOTHING;
