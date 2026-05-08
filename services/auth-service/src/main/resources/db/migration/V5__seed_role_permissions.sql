-- Seed role_permissions for the system roles created in V2/V4.
--
-- V1 inserted the 13 platform permissions:
--   user:read, user:write, role:read, role:write,
--   booking:read, booking:create, booking:cancel,
--   customer:read, customer:write,
--   payment:create, report:branch, report:org, audit:read
--
-- V2/V4 inserted the system role catalog per tenant. Until now the
-- role_permissions join table was empty, which meant that AuthController
-- emitted JWTs with an empty `perms` claim and the gateway/services
-- could only enforce role-level (not permission-level) checks.
--
-- This V5 grants the appropriate permission set to each system role.
-- All inserts are tenant-agnostic: we match role.code + role.is_system=TRUE
-- so every tenant's copy of TENANT_OWNER, ORG_OWNER, etc. gets seeded.

SET search_path TO auth;

-- TENANT_OWNER: full platform — every defined permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'TENANT_OWNER' AND r.is_system = TRUE
ON CONFLICT DO NOTHING;

-- ORG_OWNER: everything except audit:read (audit is a tenant-platform concern).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'ORG_OWNER' AND r.is_system = TRUE
  AND p.code NOT IN ('audit:read')
ON CONFLICT DO NOTHING;

-- BRANCH_MANAGER: branch-level operational subset.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'BRANCH_MANAGER' AND r.is_system = TRUE
  AND p.code IN (
    'user:read',
    'booking:read', 'booking:create', 'booking:cancel',
    'customer:read', 'customer:write',
    'payment:create', 'report:branch'
  )
ON CONFLICT DO NOTHING;

-- RECEPTIONIST: front-desk subset (no reports, no user mgmt).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'RECEPTIONIST' AND r.is_system = TRUE
  AND p.code IN (
    'booking:read', 'booking:create', 'booking:cancel',
    'customer:read', 'customer:write',
    'payment:create'
  )
ON CONFLICT DO NOTHING;

-- THERAPIST: read-only on the things they need to perform their work.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'THERAPIST' AND r.is_system = TRUE
  AND p.code IN ('booking:read', 'customer:read')
ON CONFLICT DO NOTHING;

-- ACCOUNTANT: report-focused, plus the read context to interpret bookings.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'ACCOUNTANT' AND r.is_system = TRUE
  AND p.code IN (
    'booking:read', 'customer:read',
    'payment:create', 'report:branch', 'report:org'
  )
ON CONFLICT DO NOTHING;
