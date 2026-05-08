-- Outbound webhooks. Tenants register HTTPS endpoints + an HMAC secret;
-- the consumer fans out matching domain events to those endpoints with
-- exponential-backoff retry. Failed deliveries are kept in `webhook_deliveries`
-- so admins can inspect, manually retry, or delete.

SET search_path TO notification;

CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(128) NOT NULL,
    target_url      TEXT NOT NULL,
    secret          VARCHAR(128) NOT NULL,                  -- shared HMAC secret
    event_filters   TEXT[] NOT NULL DEFAULT ARRAY['*'],     -- ['kaori.booking.*', 'kaori.payment.completed.v1']
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    headers         JSONB NOT NULL DEFAULT '{}'::jsonb,     -- extra headers (e.g. X-Tenant-ID)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id) WHERE is_active = TRUE;

CREATE TABLE webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id      UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_topic     VARCHAR(128) NOT NULL,
    event_id        VARCHAR(64),
    payload         JSONB NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','succeeded','failed','retrying')),
    attempt         INT NOT NULL DEFAULT 0,
    last_status_code INT,
    last_response   TEXT,
    next_retry_at   TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliveries_pending ON webhook_deliveries(next_retry_at)
    WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
