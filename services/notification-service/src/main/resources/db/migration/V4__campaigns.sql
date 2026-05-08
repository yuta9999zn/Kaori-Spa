-- Marketing campaigns: bulk send messages to a customer segment via SMS,
-- email, or in-app push.
--
-- Workflow:
--   1. Marketer creates a `campaign` with target_segment + channel + template.
--   2. Scheduler resolves segment to phone/email list, materialises into
--      `campaign_sends` rows.
--   3. Worker drains pending sends, calls SmsSender / EmailSender, updates
--      status. Open / click events come back via webhook (out of scope here).
--
-- Segment is stored as JSONB filter — interpreted by the resolver service
-- (`segment-resolver` query against customer.customers).

SET search_path TO notification;

CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    channel         VARCHAR(16) NOT NULL CHECK (channel IN ('sms', 'email', 'inapp', 'push')),
    template_code   VARCHAR(64) NOT NULL,
    segment_filter  JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_at    TIMESTAMPTZ,
    status          VARCHAR(16) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','scheduled','running','done','cancelled','failed')),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    total_recipients INT NOT NULL DEFAULT 0,
    sent_count      INT NOT NULL DEFAULT 0,
    failed_count    INT NOT NULL DEFAULT 0,
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_tenant_status ON campaigns(tenant_id, status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at)
    WHERE status IN ('scheduled', 'running');

CREATE TABLE campaign_sends (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(32),
    recipient_email VARCHAR(255),
    customer_id     UUID,
    rendered_body   TEXT NOT NULL,
    rendered_subject VARCHAR(255),
    status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'sent', 'failed', 'opened', 'clicked', 'bounced')),
    provider_id     VARCHAR(128),
    error           VARCHAR(512),
    sent_at         TIMESTAMPTZ,
    opened_at       TIMESTAMPTZ,
    clicked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_sends_pending ON campaign_sends(campaign_id, status) WHERE status = 'pending';
CREATE INDEX idx_campaign_sends_recipient ON campaign_sends(recipient_phone) WHERE recipient_phone IS NOT NULL;
