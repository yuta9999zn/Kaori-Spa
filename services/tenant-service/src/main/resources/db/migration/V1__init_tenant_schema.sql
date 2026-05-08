CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS tenant;
SET search_path TO tenant;

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(64) UNIQUE NOT NULL,
    name          JSONB NOT NULL,
    price_monthly NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency      CHAR(3) NOT NULL DEFAULT 'VND',
    features      JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (code, name, price_monthly, features) VALUES
    ('starter',      '{"vi":"Khởi đầu","en":"Starter"}'::jsonb,    1990000, '{"max_branches": 2, "ai_tokens_monthly": 100000}'::jsonb),
    ('professional', '{"vi":"Chuyên nghiệp","en":"Professional"}'::jsonb, 4990000, '{"max_branches": 10, "ai_tokens_monthly": 500000}'::jsonb),
    ('enterprise',   '{"vi":"Doanh nghiệp","en":"Enterprise"}'::jsonb,    9990000, '{"max_branches": 100, "ai_tokens_monthly": 2000000}'::jsonb);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE tenants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(64) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    status        VARCHAR(16) NOT NULL DEFAULT 'active',
    plan_id       UUID REFERENCES plans(id),
    locale_default VARCHAR(8) NOT NULL DEFAULT 'vi',
    allowed_origins TEXT[] NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code            VARCHAR(64) NOT NULL,
    name            JSONB NOT NULL,
    slug            VARCHAR(64) NOT NULL,
    logo_url        TEXT,
    primary_locale  VARCHAR(8) NOT NULL DEFAULT 'vi',
    supported_locales VARCHAR(8)[] NOT NULL DEFAULT ARRAY['vi'],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_org_tenant_code ON organizations(tenant_id, code);
CREATE UNIQUE INDEX uniq_org_slug ON organizations(slug);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE branches (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code          VARCHAR(64) NOT NULL,
    name          JSONB NOT NULL,
    address       JSONB NOT NULL,
    phone         VARCHAR(32),
    lat           NUMERIC(9,6),
    lng           NUMERIC(9,6),
    timezone      VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    directions_url TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE UNIQUE INDEX uniq_branch_org_code ON branches(org_id, code);

CREATE TABLE branch_business_hours (
    branch_id  UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    weekday    SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    open_time  TIME NOT NULL,
    close_time TIME NOT NULL,
    PRIMARY KEY (branch_id, weekday)
);

-- ────────────────────────────────────────────────────────────────────────
-- Seed Natural Beauty tenant + 2 Kim Ma branches.
INSERT INTO tenants (code, name, plan_id, allowed_origins)
SELECT 'natural-beauty', 'Natural Beauty', id, ARRAY['https://natural.kaorispa.io']
FROM plans WHERE code = 'professional';

INSERT INTO organizations (tenant_id, code, name, slug, primary_locale, supported_locales)
SELECT id, 'natural-beauty',
       '{"vi":"Natural Beauty","en":"Natural Beauty","ja":"Natural Beauty","zh":"Natural Beauty","ko":"Natural Beauty"}'::jsonb,
       'natural-beauty', 'vi', ARRAY['vi','en','ja','zh','ko']
FROM tenants WHERE code = 'natural-beauty';

INSERT INTO branches (tenant_id, org_id, code, name, address, phone, lat, lng, directions_url)
SELECT t.id, o.id, 'nb-kim-ma-575',
       '{"vi":"Natural Beauty 575 Kim Mã","en":"Natural Beauty 575 Kim Ma"}'::jsonb,
       '{"vi":"575 Kim Mã, Ba Đình, Hà Nội","en":"575 Kim Ma, Ba Dinh, Hanoi"}'::jsonb,
       '+84 24 7300 0575', 21.0335, 105.8147,
       'https://maps.google.com/?q=575+Kim+M%C3%A3+Ba+%C4%90%C3%ACnh+H%C3%A0+N%E1%BB%99i'
FROM tenants t JOIN organizations o ON o.tenant_id = t.id
WHERE t.code = 'natural-beauty';

INSERT INTO branches (tenant_id, org_id, code, name, address, phone, lat, lng, directions_url)
SELECT t.id, o.id, 'nb-kim-ma-625',
       '{"vi":"Natural Beauty 625 Kim Mã","en":"Natural Beauty 625 Kim Ma"}'::jsonb,
       '{"vi":"625 Kim Mã, Ba Đình, Hà Nội","en":"625 Kim Ma, Ba Dinh, Hanoi"}'::jsonb,
       '+84 24 7300 0625', 21.0339, 105.8132,
       'https://maps.google.com/?q=625+Kim+M%C3%A3+Ba+%C4%90%C3%ACnh+H%C3%A0+N%E1%BB%99i'
FROM tenants t JOIN organizations o ON o.tenant_id = t.id
WHERE t.code = 'natural-beauty';
