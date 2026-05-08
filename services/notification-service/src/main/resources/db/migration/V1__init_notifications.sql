-- Persistent notification inbox.
--
-- One row per (recipient × event). Created by the Kafka consumer for each
-- domain event the user should see (booking new for receptionists, payment
-- confirmation for accountants, etc.). The inbox UI calls
-- /v1/notifications?unreadOnly=true to drive the bell badge count.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS notification;
SET search_path TO notification;

CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    branch_id    UUID,
    user_id      UUID NOT NULL,                    -- recipient
    kind         VARCHAR(32) NOT NULL,             -- booking.created, payment.completed, …
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity     VARCHAR(16) NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info','warn','danger','success')),
    read_at      TIMESTAMPTZ,
    archived_at  TIMESTAMPTZ,
    deep_link    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC)
    WHERE read_at IS NULL AND archived_at IS NULL;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_branch ON notifications(branch_id, created_at DESC) WHERE branch_id IS NOT NULL;

-- Per-user channel preferences.
CREATE TABLE notification_preferences (
    user_id      UUID NOT NULL,
    channel      VARCHAR(16) NOT NULL CHECK (channel IN ('inapp','email','sms','push')),
    enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, channel)
);
