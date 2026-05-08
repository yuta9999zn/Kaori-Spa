-- Notification templates with locale fallback chain.
--
-- Lookup order: (tenant_id, code, channel, locale) → (tenant_id, code, channel, 'en')
--               → (NULL tenant_id = global) → bail.
-- Variables use {{name}} mustache-style; render is done in Java by a thin
-- replacer (no full Mustache library needed for our use cases).

SET search_path TO notification;

CREATE TABLE notification_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID,                       -- NULL = global fallback
    code         VARCHAR(64) NOT NULL,       -- booking.created, booking.cancelled, …
    channel      VARCHAR(16) NOT NULL CHECK (channel IN ('email','sms','push','inapp')),
    locale       VARCHAR(8)  NOT NULL,
    subject      VARCHAR(255),               -- email only
    body         TEXT NOT NULL,
    vars         JSONB NOT NULL DEFAULT '[]'::jsonb,  -- documented variable names
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_template_key
    ON notification_templates(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
                              code, channel, locale);

-- ─── Seed: booking.created × 5 locales × 3 channels (sms/email/inapp) ──
INSERT INTO notification_templates (tenant_id, code, channel, locale, subject, body, vars) VALUES
  (NULL, 'booking.created', 'sms',   'vi',  NULL,
   'Natural Beauty: đã ghi nhận lịch {{code}} lúc {{startTime}}. Hẹn gặp bạn.',
   '["code","startTime"]'::jsonb),
  (NULL, 'booking.created', 'email', 'vi',
   'Xác nhận đặt lịch {{code}} — Natural Beauty',
   E'Xin chào {{customerName}},\n\nLịch hẹn của bạn đã được xác nhận:\n\n  Mã: {{code}}\n  Dịch vụ: {{serviceName}}\n  Thời gian: {{startTime}}\n  Chi nhánh: {{branchName}}\n\nXin cảm ơn — Natural Beauty.',
   '["customerName","code","serviceName","startTime","branchName"]'::jsonb),
  (NULL, 'booking.created', 'inapp', 'vi',  'Booking mới',
   '{{customerName}} · {{serviceName}} · {{startTime}}',
   '["customerName","serviceName","startTime"]'::jsonb),

  (NULL, 'booking.created', 'sms',   'en',  NULL,
   'Natural Beauty: booking {{code}} confirmed for {{startTime}}. See you soon.',
   '["code","startTime"]'::jsonb),
  (NULL, 'booking.created', 'email', 'en',
   'Booking {{code}} confirmation — Natural Beauty',
   E'Hello {{customerName}},\n\nYour booking is confirmed:\n\n  Code: {{code}}\n  Service: {{serviceName}}\n  Time: {{startTime}}\n  Branch: {{branchName}}\n\nThank you — Natural Beauty.',
   '["customerName","code","serviceName","startTime","branchName"]'::jsonb),

  (NULL, 'booking.created', 'sms',   'ja',  NULL,
   'Natural Beauty: ご予約 {{code}} を {{startTime}} に承りました。',
   '["code","startTime"]'::jsonb),
  (NULL, 'booking.created', 'email', 'ja',
   'ご予約確認 {{code}} — Natural Beauty',
   E'{{customerName}} 様\n\nご予約を承りました:\n\n  予約番号: {{code}}\n  サービス: {{serviceName}}\n  日時: {{startTime}}\n  店舗: {{branchName}}\n\n誠にありがとうございます — Natural Beauty.',
   '["customerName","code","serviceName","startTime","branchName"]'::jsonb),

  (NULL, 'booking.created', 'sms',   'zh',  NULL,
   'Natural Beauty: 预约 {{code}} 已于 {{startTime}} 确认。',
   '["code","startTime"]'::jsonb),
  (NULL, 'booking.created', 'email', 'zh',
   '预约 {{code}} 确认 — Natural Beauty',
   E'{{customerName}} 您好,\n\n您的预约已确认:\n\n  编号: {{code}}\n  服务: {{serviceName}}\n  时间: {{startTime}}\n  门店: {{branchName}}\n\n感谢您 — Natural Beauty.',
   '["customerName","code","serviceName","startTime","branchName"]'::jsonb),

  (NULL, 'booking.created', 'sms',   'ko',  NULL,
   'Natural Beauty: {{startTime}} 예약 {{code}} 확정되었습니다.',
   '["code","startTime"]'::jsonb),
  (NULL, 'booking.created', 'email', 'ko',
   '예약 {{code}} 확인 — Natural Beauty',
   E'{{customerName}} 님,\n\n예약이 확정되었습니다:\n\n  번호: {{code}}\n  서비스: {{serviceName}}\n  시간: {{startTime}}\n  지점: {{branchName}}\n\n감사합니다 — Natural Beauty.',
   '["customerName","code","serviceName","startTime","branchName"]'::jsonb);
