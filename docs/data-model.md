# Data model — Kaori Spa Platform

> Mô hình dữ liệu chuẩn của hệ thống. Mọi bảng đều có `tenant_id UUID NOT NULL` (trừ bảng `tenants` chính) và index composite bắt đầu bằng `tenant_id`.

## 1. Quy ước chung

- Khoá chính: `id UUID DEFAULT gen_random_uuid()`.
- Cột audit: `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete).
- Multi-tenant: `tenant_id` ở mọi bảng; FK `org_id`, `branch_id` khi áp dụng.
- Money: `NUMERIC(15,2)` + cột `currency CHAR(3)` mặc định `VND`.
- Tên bảng số nhiều, snake_case (`bookings`, `service_categories`).
- I18n: text hiển thị dùng `JSONB` với key locale, vd: `name JSONB → {"vi":"Triệt nách","en":"Underarm"}`.

## 2. Bảng cốt lõi

### 2.1 Platform & Tenants

```
tenants               (id, code, name, status, plan_id, created_at, ...)
plans                 (id, code, name, price_monthly, features JSONB, ...)
subscriptions         (id, tenant_id, plan_id, period_start, period_end, status, ...)
billing_invoices      (id, tenant_id, subscription_id, amount, status, due_at, ...)
audit_events          (id, tenant_id, actor_id, action, entity_type, entity_id, payload JSONB, ip, ts)
```

### 2.2 Organization & Branch

```
organizations         (id, tenant_id, code, name JSONB, slug, logo_url, locale_default, ...)
branches              (id, tenant_id, org_id, code, name JSONB, address, phone, lat, lng, timezone, ...)
branch_business_hours (id, branch_id, weekday, open_time, close_time)
rooms                 (id, tenant_id, branch_id, code, name JSONB, capacity, room_type, ...)
equipments            (id, tenant_id, branch_id, code, name JSONB, status, ...)
```

### 2.3 IAM

```
users                 (id, tenant_id, email, phone, password_hash, locale, status, ...)
user_profiles         (user_id, full_name, avatar_url, dob, gender, ...)
user_2fa              (user_id, secret, enabled, backup_codes JSONB)
roles                 (id, tenant_id, code, name JSONB, scope, is_system)
permissions           (id, code, name JSONB, group)
role_permissions      (role_id, permission_id)
user_roles            (user_id, role_id, scope_org_id, scope_branch_id)
sessions              (id, user_id, refresh_token_hash, ip, user_agent, expires_at)
```

`scope` của role: `tenant` | `org` | `branch`.

### 2.4 Catalog

```
service_categories    (id, tenant_id, org_id, code, name JSONB, parent_id, sort, ...)
services              (id, tenant_id, org_id, code, name JSONB, description JSONB,
                       category_id, gender, duration_min, base_price, ...)
service_branch_prices (service_id, branch_id, price)         -- override theo branch
combos                (id, tenant_id, org_id, kind, name JSONB, total_price, ...)
combo_items           (combo_id, service_id, sessions, unit_price)
```

`kind` combo: `session` (gói buổi 1 dịch vụ) | `package` (combo nhiều dịch vụ).

### 2.5 Customer

```
customers             (id, tenant_id, org_id, code, full_name, phone, email,
                       gender, dob, locale, segment, points, ...)
customer_health_notes (id, customer_id, note, severity, created_at)
customer_combos       (id, customer_id, combo_id, branch_id, purchase_date, ...)
combo_sessions        (id, customer_combo_id, service_id, used_at, branch_id, staff_id)
loyalty_transactions  (id, customer_id, delta, reason, ref_id, created_at)
```

### 2.6 Booking

```
booking_slots         (id, tenant_id, branch_id, start_at, end_at, capacity)
bookings              (id, tenant_id, branch_id, customer_id, status, source,
                       start_at, end_at, total_amount, ...)
booking_items         (id, booking_id, service_id, staff_id, room_id, duration_min, price)
booking_status_logs   (id, booking_id, from_status, to_status, by_user, ts, note)
```

### 2.7 Staff & Schedule

```
staff                 (id, user_id, tenant_id, branch_id, role_in_branch, hire_date, ...)
staff_skills          (staff_id, service_id, level)
staff_shifts          (id, staff_id, date, start, end, off_reason)
staff_commissions     (id, staff_id, booking_item_id, commission_amount, settled)
salary_records        (id, staff_id, period, base, commission_total, bonus, deduction, net)
```

### 2.8 Inventory

```
products              (id, tenant_id, org_id, code, name JSONB, sku, unit, base_price)
inventory_balances    (product_id, branch_id, qty)
inventory_moves       (id, tenant_id, branch_id, product_id, delta, type, ref_type, ref_id, ts)
```

### 2.9 Payment

```
payment_methods       (id, tenant_id, code, name JSONB)
transactions          (id, tenant_id, branch_id, type, method_id, amount,
                       booking_id, customer_id, status, paid_at, ...)
expenses              (id, tenant_id, branch_id, code, name JSONB, amount, expense_date)
opening_cash          (id, tenant_id, branch_id, date, amount)
```

### 2.10 Notification

```
notification_templates (id, tenant_id, code, channel, locale, subject, body, vars JSONB)
notifications          (id, tenant_id, user_id, channel, template_id, status, payload JSONB, sent_at)
notification_preferences (user_id, channel, enabled)
```

### 2.11 AI / Chatbot

```
ai_conversations      (id, tenant_id, org_id, user_id, channel, started_at, ended_at)
ai_messages           (id, conversation_id, role, content, tokens_in, tokens_out, cost, ts)
ai_usage              (id, tenant_id, user_id, model, tokens, cost, ts)
embeddings            (id, tenant_id, kind, ref_id, vector vector(1536), text)
```

`kind`: `customer_profile` | `service_doc` | `faq` | …

### 2.12 Analytics (ClickHouse)

```
fact_bookings         (tenant_id, branch_id, booking_id, status, ...)
fact_transactions     (tenant_id, branch_id, transaction_id, type, method, amount, ts)
fact_audit_events     (tenant_id, actor_id, action, entity_type, ts)
```

## 3. Index gợi ý

- `(tenant_id, created_at DESC)` ở mọi bảng có `created_at`.
- `(tenant_id, branch_id, start_at)` ở `bookings`.
- `(tenant_id, customer_id, start_at DESC)` ở `bookings`.
- `(tenant_id, service_id, used_at)` ở `combo_sessions`.
- Partial index `WHERE deleted_at IS NULL` cho mọi soft-delete.

## 4. Sharding strategy (tương lai)

Khi `tenant_id` count vượt vài nghìn:
- Bookings + transactions partition theo `RANGE (created_at)` hằng tháng + `LIST (tenant_id)` cho top-tenants.
- ClickHouse partition `toYYYYMM(ts)` + `ORDER BY (tenant_id, ts)`.
