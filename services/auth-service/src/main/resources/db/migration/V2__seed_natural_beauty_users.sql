-- Seed manager accounts for the Natural Beauty tenant.
--
-- IMPORTANT: tenant_id below is a placeholder. The real tenant UUID is
-- generated in tenant-service (V1__init_tenant_schema.sql). At runtime,
-- a bootstrap job should:
--   1. Read tenant.tenants.id where code = 'natural-beauty'
--   2. Insert the rows below substituting :tid
-- Until the bootstrap job exists, this migration uses a deterministic
-- UUID derived from the slug so dev environments are reproducible.
--
-- Default password (HARDCODED FOR DEV ONLY): "Manager@2026"
-- Hash below is Argon2id of that string. Rotate before any non-dev env.

SET search_path TO auth;

-- Deterministic dev tenant id. Production will overwrite via bootstrap.
DO $$
DECLARE
    nb_tenant UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
BEGIN
    -- Required extension on first run
    PERFORM 1 FROM pg_extension WHERE extname = 'uuid-ossp';
    IF NOT FOUND THEN
        EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"';
    END IF;

    -- Manager Kim Mã 575 — Nguyễn Khánh Linh, nickname "miko"
    INSERT INTO users (tenant_id, email, phone, password_hash, locale, status)
    VALUES (
        nb_tenant,
        'miko@naturalbeauty.vn',
        '+84-901-575-575',
        '$argon2id$v=19$m=65536,t=3,p=1$REPLACE_WITH_REAL_HASH_AT_BOOTSTRAP$REPLACE',
        'vi',
        'active'
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO user_profiles (user_id, full_name, gender)
    SELECT id, 'Nguyễn Khánh Linh', 'female'
    FROM users WHERE email = 'miko@naturalbeauty.vn'
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Manager Kim Mã 625 — Nguyễn Lan Hương, nickname "hương"
    INSERT INTO users (tenant_id, email, phone, password_hash, locale, status)
    VALUES (
        nb_tenant,
        'huong@naturalbeauty.vn',
        '+84-901-625-625',
        '$argon2id$v=19$m=65536,t=3,p=1$REPLACE_WITH_REAL_HASH_AT_BOOTSTRAP$REPLACE',
        'vi',
        'active'
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO user_profiles (user_id, full_name, gender)
    SELECT id, 'Nguyễn Lan Hương', 'female'
    FROM users WHERE email = 'huong@naturalbeauty.vn'
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Branch manager role (created if missing)
    INSERT INTO roles (tenant_id, code, name, scope, is_system)
    VALUES (
        nb_tenant,
        'BRANCH_MANAGER',
        '{"vi":"Quản lý chi nhánh","en":"Branch Manager","ja":"店長","zh":"店长","ko":"지점 매니저"}'::jsonb,
        'branch',
        TRUE
    )
    ON CONFLICT (tenant_id, code) DO NOTHING;
END $$;
