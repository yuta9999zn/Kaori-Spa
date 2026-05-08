-- Seed system roles for the Natural Beauty tenant and grant a TENANT_OWNER role
-- to the bootstrap admin so RBAC-protected endpoints are reachable in dev.
--
-- Why this exists:
--   * V2 inserted manager users + a single BRANCH_MANAGER role, but never grants any
--     user_roles row, so AuthController.issueFor(...) (which now reads user_roles)
--     would still emit the CUSTOMER fallback for them.
--   * V3 ensures CUSTOMER exists per tenant for the public signup flow.
--   * This V4 fills in the rest of the system role catalog and gives the seed admins
--     a real grant so end-to-end RBAC tests can sign in with miko@/huong@ and hit
--     @PreAuthorize("hasAnyRole('TENANT_OWNER',...)") endpoints successfully.

SET search_path TO auth;

DO $$
DECLARE
    nb_tenant UUID := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, 'natural-beauty');
    miko_id   UUID;
    huong_id  UUID;
    tenant_owner_id UUID;
    branch_manager_id UUID;
BEGIN
    -- ── System role catalog ────────────────────────────────────────────────
    -- Tenant scope
    INSERT INTO roles (tenant_id, code, name, scope, is_system) VALUES
        (nb_tenant, 'TENANT_OWNER',
         '{"vi":"Chủ nền tảng","en":"Tenant Owner","ja":"テナントオーナー","zh":"租户所有者","ko":"테넌트 소유자"}'::jsonb,
         'tenant', TRUE),
        (nb_tenant, 'ACCOUNTANT',
         '{"vi":"Kế toán","en":"Accountant","ja":"会計","zh":"会计","ko":"회계"}'::jsonb,
         'tenant', TRUE)
    ON CONFLICT (tenant_id, code) DO NOTHING;

    -- Org scope
    INSERT INTO roles (tenant_id, code, name, scope, is_system) VALUES
        (nb_tenant, 'ORG_OWNER',
         '{"vi":"Chủ tổ chức","en":"Org Owner","ja":"組織オーナー","zh":"组织所有者","ko":"조직 소유자"}'::jsonb,
         'org', TRUE)
    ON CONFLICT (tenant_id, code) DO NOTHING;

    -- Branch scope (BRANCH_MANAGER already inserted in V2; idempotent re-insert is fine).
    INSERT INTO roles (tenant_id, code, name, scope, is_system) VALUES
        (nb_tenant, 'BRANCH_MANAGER',
         '{"vi":"Quản lý chi nhánh","en":"Branch Manager","ja":"店長","zh":"店长","ko":"지점 매니저"}'::jsonb,
         'branch', TRUE),
        (nb_tenant, 'RECEPTIONIST',
         '{"vi":"Lễ tân","en":"Receptionist","ja":"受付","zh":"前台","ko":"접수원"}'::jsonb,
         'branch', TRUE),
        (nb_tenant, 'THERAPIST',
         '{"vi":"Kỹ thuật viên","en":"Therapist","ja":"セラピスト","zh":"技师","ko":"테라피스트"}'::jsonb,
         'branch', TRUE)
    ON CONFLICT (tenant_id, code) DO NOTHING;

    -- ── User-role grants ───────────────────────────────────────────────────
    SELECT id INTO miko_id  FROM users WHERE email = 'miko@naturalbeauty.vn';
    SELECT id INTO huong_id FROM users WHERE email = 'huong@naturalbeauty.vn';

    SELECT id INTO tenant_owner_id   FROM roles WHERE tenant_id = nb_tenant AND code = 'TENANT_OWNER';
    SELECT id INTO branch_manager_id FROM roles WHERE tenant_id = nb_tenant AND code = 'BRANCH_MANAGER';

    -- Promote both seed admins to TENANT_OWNER so they can exercise all RBAC paths
    -- in dev. Production will revoke / scope these down via the admin UI.
    IF miko_id IS NOT NULL AND tenant_owner_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, scope_org_id, scope_branch_id)
        VALUES (miko_id, tenant_owner_id, NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;

    IF huong_id IS NOT NULL AND tenant_owner_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, scope_org_id, scope_branch_id)
        VALUES (huong_id, tenant_owner_id, NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Also keep the historical BRANCH_MANAGER assignment so tokens carry both
    -- TENANT_OWNER and BRANCH_MANAGER and we exercise the multi-role path.
    -- scope_branch_id is left NULL here because the branch UUIDs live in branch-service;
    -- tightening the scope is a follow-up bootstrap job.
    IF miko_id IS NOT NULL AND branch_manager_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, scope_org_id, scope_branch_id)
        VALUES (miko_id, branch_manager_id, NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;

    IF huong_id IS NOT NULL AND branch_manager_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, scope_org_id, scope_branch_id)
        VALUES (huong_id, branch_manager_id, NULL, NULL)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
