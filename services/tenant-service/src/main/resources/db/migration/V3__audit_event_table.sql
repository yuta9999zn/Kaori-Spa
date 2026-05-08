-- Audit event mirror table.
--
-- The AuditAspect (in shared-kernel) publishes to Kafka topic
-- kaori.audit.event.v1 for downstream analytics (ClickHouse). To support
-- HTTP read endpoints (tenant-admin "Audit" page) without spinning up a
-- ClickHouse query path, the aspect ALSO best-effort inserts into this
-- table. Failures are swallowed — audit must never break business flow.
--
-- Index strategy:
--   - (tenant_id, ts DESC)  — primary "recent events for tenant" query
--   - (action)              — filter by action substring/exact match
--   - (actor_id)            — "who did what" lookups

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO tenant;

CREATE TABLE audit_event (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ts            TIMESTAMPTZ NOT NULL DEFAULT now(),
    tenant_id     UUID,
    actor_id      UUID,
    action        VARCHAR(96) NOT NULL,
    entity_type   VARCHAR(48),
    entity_id     VARCHAR(96),
    ip            VARCHAR(64),
    user_agent    TEXT,
    payload       JSONB
);
CREATE INDEX idx_audit_event_tenant_ts ON audit_event (tenant_id, ts DESC);
CREATE INDEX idx_audit_event_action ON audit_event (action);
CREATE INDEX idx_audit_event_actor ON audit_event (actor_id);
