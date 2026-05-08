-- Catalog: dịch vụ, danh mục, gói combo, giá theo branch.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS catalog;
SET search_path TO catalog;

CREATE TABLE service_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    org_id      UUID NOT NULL,
    code        VARCHAR(64) NOT NULL,
    name        JSONB NOT NULL,
    parent_id   UUID REFERENCES service_categories(id),
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_cat_org_code ON service_categories(org_id, code);

CREATE TABLE services (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    org_id        UUID NOT NULL,
    code          VARCHAR(64) NOT NULL,
    name          JSONB NOT NULL,
    description   JSONB,
    category_id   UUID REFERENCES service_categories(id),
    gender        VARCHAR(16) NOT NULL DEFAULT 'unisex',
    region        VARCHAR(32) NOT NULL,
    duration_min  INT NOT NULL,
    base_price    NUMERIC(15,2) NOT NULL,
    currency      CHAR(3) NOT NULL DEFAULT 'VND',
    is_combo      BOOLEAN NOT NULL DEFAULT FALSE,
    sessions      INT NOT NULL DEFAULT 1,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_services_org_code ON services(org_id, code);
CREATE INDEX idx_services_tenant_active ON services(tenant_id, is_active);

-- Branch-level price override.
CREATE TABLE service_branch_prices (
    service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL,
    price       NUMERIC(15,2) NOT NULL,
    PRIMARY KEY (service_id, branch_id)
);
CREATE INDEX idx_branch_prices_branch ON service_branch_prices(branch_id);

-- Multi-service packages.
CREATE TABLE combos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    org_id       UUID NOT NULL,
    code         VARCHAR(64) NOT NULL,
    name         JSONB NOT NULL,
    kind         VARCHAR(16) NOT NULL CHECK (kind IN ('session','package')),
    total_price  NUMERIC(15,2) NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_combos_org_code ON combos(org_id, code);

CREATE TABLE combo_items (
    combo_id     UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    service_id   UUID NOT NULL REFERENCES services(id),
    sessions     INT NOT NULL DEFAULT 1,
    unit_price   NUMERIC(15,2) NOT NULL,
    PRIMARY KEY (combo_id, service_id)
);
