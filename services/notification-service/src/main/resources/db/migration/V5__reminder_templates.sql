-- Reminder SMS templates: confirmation (regular + imminent for last-minute
-- bookings) plus h24 / h1 reminders. Imminent template is critical because
-- a customer who books 30 minutes ahead must NOT receive "see you tomorrow"
-- copy — the scheduler routes them to *_imminent based on lead time.

SET search_path TO notification;

INSERT INTO notification_templates (tenant_id, code, channel, locale, subject, body, vars) VALUES
  -- ── confirmation (lead-time >= 2h) ──────────────────────────────────────
  (NULL, 'booking.confirmation', 'sms', 'vi', NULL,
   'Natural Beauty: đã ghi nhận lịch {{code}} lúc {{startAt}}. Hẹn gặp bạn.',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.confirmation', 'sms', 'en', NULL,
   'Natural Beauty: booking {{code}} confirmed for {{startAt}}. See you soon.',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.confirmation', 'sms', 'ja', NULL,
   'Natural Beauty: ご予約 {{code}}（{{startAt}}）を承りました。',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.confirmation', 'sms', 'zh', NULL,
   'Natural Beauty: 预约 {{code}} 已确认（{{startAt}}）。',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.confirmation', 'sms', 'ko', NULL,
   'Natural Beauty: {{startAt}} 예약 {{code}} 확정되었습니다.',
   '["code","startAt"]'::jsonb),

  -- ── confirmation_imminent (lead-time < 2h, last-minute booking) ─────────
  (NULL, 'booking.confirmation_imminent', 'sms', 'vi', NULL,
   'Natural Beauty: lịch {{code}} chỉ còn {{minutesAway}} phút ({{startAt}}). Vui lòng có mặt sớm 5 phút.',
   '["code","startAt","minutesAway"]'::jsonb),
  (NULL, 'booking.confirmation_imminent', 'sms', 'en', NULL,
   'Natural Beauty: booking {{code}} starts in {{minutesAway}} min ({{startAt}}). Please arrive 5 min early.',
   '["code","startAt","minutesAway"]'::jsonb),
  (NULL, 'booking.confirmation_imminent', 'sms', 'ja', NULL,
   'Natural Beauty: ご予約 {{code}} まで {{minutesAway}} 分（{{startAt}}）。5分前にお越しください。',
   '["code","startAt","minutesAway"]'::jsonb),
  (NULL, 'booking.confirmation_imminent', 'sms', 'zh', NULL,
   'Natural Beauty: 预约 {{code}} 还有 {{minutesAway}} 分钟（{{startAt}}），请提前5分钟到店。',
   '["code","startAt","minutesAway"]'::jsonb),
  (NULL, 'booking.confirmation_imminent', 'sms', 'ko', NULL,
   'Natural Beauty: 예약 {{code}} {{minutesAway}}분 후 시작（{{startAt}}）. 5분 일찍 도착해주세요.',
   '["code","startAt","minutesAway"]'::jsonb),

  -- ── reminder_h24 (24h before, only if lead-time >= 24h) ────────────────
  (NULL, 'booking.reminder_h24', 'sms', 'vi', NULL,
   'Natural Beauty: nhắc lịch {{code}} ngày mai ({{startAt}}). Hẹn gặp bạn.',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h24', 'sms', 'en', NULL,
   'Natural Beauty: reminder for booking {{code}} tomorrow at {{startAt}}.',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h24', 'sms', 'ja', NULL,
   'Natural Beauty: 明日 {{startAt}} のご予約 {{code}} をお忘れなく。',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h24', 'sms', 'zh', NULL,
   'Natural Beauty: 提醒您明天 {{startAt}} 的预约 {{code}}。',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h24', 'sms', 'ko', NULL,
   'Natural Beauty: 내일 {{startAt}} 예약 {{code}} 알림.',
   '["code","startAt"]'::jsonb),

  -- ── reminder_h1 (1h before, only if lead-time >= 1h) ───────────────────
  (NULL, 'booking.reminder_h1', 'sms', 'vi', NULL,
   'Natural Beauty: lịch {{code}} sau 1 giờ ({{startAt}}). Vui lòng có mặt sớm 5 phút.',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h1', 'sms', 'en', NULL,
   'Natural Beauty: booking {{code}} starts in 1 hour ({{startAt}}). Please arrive 5 min early.',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h1', 'sms', 'ja', NULL,
   'Natural Beauty: あと1時間でご予約 {{code}}（{{startAt}}）。5分前にお越しください。',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h1', 'sms', 'zh', NULL,
   'Natural Beauty: 预约 {{code}} 1小时后开始（{{startAt}}），请提前到店。',
   '["code","startAt"]'::jsonb),
  (NULL, 'booking.reminder_h1', 'sms', 'ko', NULL,
   'Natural Beauty: 1시간 후 예약 {{code}}（{{startAt}}）. 5분 일찍 도착해주세요.',
   '["code","startAt"]'::jsonb);
