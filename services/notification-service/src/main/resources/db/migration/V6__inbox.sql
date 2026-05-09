-- Per-user inbox notification center.
--
-- Companion to the existing fan-out `notifications` table (V1). Whereas the
-- legacy table was driven by Kafka domain events and used a domain-specific
-- severity vocabulary, this table is the canonical source for the
-- branch-admin /notification page and the inbox bell. Rows are inserted by
-- the notification-service consumers (booking.created, payment.received,
-- audit.alert, system.announcement, …) and read by the per-user inbox API
-- exposed at /v1/notifications.
--
-- NOTE: cross-database seeds against `auth.users` are not possible because
-- auth-service runs in its own PostgreSQL database (`kaori_auth`), so the
-- demo seed below is left as a self-contained no-op. Real demo data is
-- inserted by NotificationFanout when the Kafka pipeline first fires.

SET search_path TO notification;

CREATE TABLE inbox_notification (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    user_id      UUID NOT NULL,
    branch_id    UUID,
    type         VARCHAR(48) NOT NULL,           -- booking.created, booking.cancelled, payment.received, audit.alert, system.announcement, …
    severity     VARCHAR(16) NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info','warning','error','success')),
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    link         VARCHAR(512),                   -- optional URL to navigate to
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbox_user_unread ON inbox_notification (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_inbox_user        ON inbox_notification (user_id, created_at DESC);
CREATE INDEX idx_inbox_tenant      ON inbox_notification (tenant_id, created_at DESC);

-- Demo seed. Spec calls for `INSERT … SELECT … FROM auth.users` but auth.users
-- lives in a different database (`kaori_auth`), so a cross-database seed is
-- not possible from this Flyway migration. Instead we leave the inbox empty
-- on a fresh setup; rows are populated either by the Kafka fan-out
-- (NotificationFanout) once domain events flow, or by ad-hoc dev INSERTs.
