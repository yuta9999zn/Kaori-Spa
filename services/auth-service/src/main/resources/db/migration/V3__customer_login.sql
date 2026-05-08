-- Public-facing customer accounts. These are end-customers who self-register
-- on the client website (e.g. natural.kaorispa.io). They differ from staff
-- users in two ways:
--   * Phone-first auth (Vietnam convention).
--   * Always assigned the CUSTOMER role at the tenant scope.
--
-- The shared `users` table already supports both — this migration just
-- ensures the CUSTOMER role exists per tenant so signup works without
-- bootstrap.

SET search_path TO auth;

-- Insert CUSTOMER role for every existing tenant (idempotent).
INSERT INTO roles (tenant_id, code, name, scope, is_system)
SELECT DISTINCT u.tenant_id,
       'CUSTOMER',
       '{"vi":"Khách hàng","en":"Customer","ja":"お客様","zh":"顾客","ko":"고객"}'::jsonb,
       'tenant',
       TRUE
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.tenant_id = u.tenant_id AND r.code = 'CUSTOMER'
);
