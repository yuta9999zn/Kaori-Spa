-- Tenant onboarding wizard state.
--
-- Tracks each tenant's progress through the multi-step setup wizard
-- (welcome -> org -> branch -> team -> done). One row per tenant.
-- The metadata JSONB lets each step stash arbitrary client-side state
-- (e.g. partial form values) without requiring a schema change per step.

SET search_path TO tenant;

CREATE TABLE tenant_onboarding (
    tenant_id       UUID PRIMARY KEY,
    current_step    VARCHAR(32) NOT NULL DEFAULT 'welcome',
    completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Seed: every existing tenant is considered already onboarded so the wizard
-- doesn't pop up on next login. New tenants will get a fresh row inserted
-- on first POST /onboarding/advance.
INSERT INTO tenant_onboarding (tenant_id, current_step, completed_steps, completed_at)
SELECT id, 'done', '["welcome","org","branch","team","done"]'::jsonb, now()
FROM tenant.tenants
ON CONFLICT (tenant_id) DO NOTHING;
