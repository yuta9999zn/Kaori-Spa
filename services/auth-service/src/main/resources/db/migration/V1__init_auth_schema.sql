-- Kaori Auth Service — initial schema
-- Multi-tenant: every row carries tenant_id (except global tenants table itself,
-- which lives in tenant-service). Tables here only see tenant_id as a foreign key.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS auth;
SET search_path TO auth;

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    email           CITEXT,
    phone           VARCHAR(32),
    password_hash   VARCHAR(255) NOT NULL,
    locale          VARCHAR(8) NOT NULL DEFAULT 'vi',
    status          VARCHAR(16) NOT NULL DEFAULT 'active',
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE EXTENSION IF NOT EXISTS citext;
CREATE UNIQUE INDEX uniq_users_tenant_email ON users (tenant_id, email)
    WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE UNIQUE INDEX uniq_users_tenant_phone ON users (tenant_id, phone)
    WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_users_tenant ON users (tenant_id);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
    user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name  VARCHAR(255),
    avatar_url TEXT,
    dob        DATE,
    gender     VARCHAR(16),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE user_2fa (
    user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret       VARCHAR(128) NOT NULL,
    enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL,
    code       VARCHAR(64) NOT NULL,
    name       JSONB NOT NULL,
    scope      VARCHAR(16) NOT NULL CHECK (scope IN ('tenant','org','branch')),
    is_system  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_roles_tenant_code ON roles (tenant_id, code);

CREATE TABLE permissions (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code  VARCHAR(96) UNIQUE NOT NULL,
    name  JSONB NOT NULL,
    "group" VARCHAR(64) NOT NULL
);

CREATE TABLE role_permissions (
    role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE user_roles (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope_org_id    UUID,
    scope_branch_id UUID,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id, COALESCE(scope_org_id, '00000000-0000-0000-0000-000000000000'),
                 COALESCE(scope_branch_id, '00000000-0000-0000-0000-000000000000'))
);

-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  VARCHAR(128) NOT NULL,
    ip                  INET,
    user_agent          TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_refresh ON sessions (refresh_token_hash);

-- ────────────────────────────────────────────────────────────────────────
-- Seed default permissions (truncated — full list seeded by service init).
INSERT INTO permissions (code, name, "group") VALUES
    ('user:read',          '{"vi":"Xem người dùng","en":"Read users"}'::jsonb,    'user'),
    ('user:write',         '{"vi":"Sửa người dùng","en":"Write users"}'::jsonb,   'user'),
    ('role:read',          '{"vi":"Xem vai trò","en":"Read roles"}'::jsonb,        'role'),
    ('role:write',         '{"vi":"Sửa vai trò","en":"Write roles"}'::jsonb,       'role'),
    ('booking:read',       '{"vi":"Xem booking","en":"Read bookings"}'::jsonb,     'booking'),
    ('booking:create',     '{"vi":"Tạo booking","en":"Create bookings"}'::jsonb,   'booking'),
    ('booking:cancel',     '{"vi":"Huỷ booking","en":"Cancel bookings"}'::jsonb,   'booking'),
    ('customer:read',      '{"vi":"Xem khách hàng","en":"Read customers"}'::jsonb, 'customer'),
    ('customer:write',     '{"vi":"Sửa khách hàng","en":"Write customers"}'::jsonb,'customer'),
    ('payment:create',     '{"vi":"Tạo thanh toán","en":"Create payments"}'::jsonb,'payment'),
    ('report:branch',      '{"vi":"Báo cáo chi nhánh","en":"Branch report"}'::jsonb,'report'),
    ('report:org',         '{"vi":"Báo cáo tổ chức","en":"Org report"}'::jsonb,    'report'),
    ('audit:read',         '{"vi":"Xem audit log","en":"Read audit"}'::jsonb,      'audit')
ON CONFLICT (code) DO NOTHING;
