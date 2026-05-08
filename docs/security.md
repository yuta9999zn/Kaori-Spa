# Bảo mật — Threat Model & Controls

## 1. Threat model (STRIDE rút gọn)

| Loại | Mối đe doạ | Phòng vệ |
|---|---|---|
| Spoofing | Mạo danh user/tenant | OAuth2 + 2FA, JWT short-lived (10p) + refresh rotate |
| Tampering | Sửa request, token | mTLS giữa service, JWT signed (RS256), HMAC outbox |
| Repudiation | Phủ nhận hành vi | Audit log bất biến (ClickHouse + retention 5 năm) |
| Information disclosure | Leak data tenant | Tenant filter ở DB, mã hoá at-rest, redact log |
| Denial of service | Spam, scrape | Rate-limit gateway, WAF, captcha public form |
| Elevation of privilege | Vượt quyền | RBAC + ABAC kiểm 2 lớp (gateway + service) |

## 2. Auth / Identity

- Password: Argon2id, parameters `t=3, m=64MB, p=1`.
- Reset link: token 1 lần dùng, TTL 30 phút.
- 2FA TOTP (RFC 6238) bắt buộc cho `TENANT_OWNER`, `ORG_OWNER`. Tổ chức bật được cho mọi role.
- Session: refresh token rotate, lưu `refresh_token_hash` chỉ. Revoke = xoá row.
- Brute-force: lockout sau 10 lần fail trong 10 phút theo IP + email.

## 3. Multi-tenant isolation

- DB level: `tenant_id NOT NULL` + Hibernate filter mặc định.
- Cache: prefix `t:{tenantId}:`.
- File / S3: bucket prefix `tenants/{tenantId}/...`.
- Mỗi service có `TenantIsolationContractTest` chạy CI.

## 4. Bảo vệ data ở các tầng

- TLS 1.3 ở mọi edge. mTLS giữa service nội bộ qua service mesh.
- At-rest: Postgres TDE / volume encryption; cột nhạy cảm (`password_hash`, `2fa_secret`, `refresh_token_hash`) dùng `pgcrypto` hoặc app-level AES-GCM.
- PII trong log: filter trước khi xuất (regex SĐT, CCCD, email).
- Backup mã hoá, retention 30 ngày, thử restore hằng tháng.

## 5. Application security

- OWASP Top 10 review hằng quý.
- CSRF token cho session-based; SameSite=Lax cookie.
- CSP nghiêm: `default-src 'self'`, allow CDN cụ thể.
- Upload file: scan `clamav`, giới hạn type, lưu trên S3 + signed URL TTL.
- Output sanitize HTML khi render bài viết user-generated (DOMPurify).
- SQL: 100% qua ORM (JPA / SQLAlchemy), không dynamic SQL với input user.

## 6. API security

- Rate limit gateway: 100 req/p / IP cho public, 1000 req/p / user authenticated.
- Idempotency-Key bắt buộc cho POST/PUT mutation.
- CORS whitelist cụ thể từng tenant domain (lưu ở `tenants.allowed_origins`).
- Webhook outbound ký HMAC, retry 5 lần exponential.

## 7. Secrets

- Vault hoặc cloud KMS. Không bao giờ commit, không in vào log.
- CI dùng OIDC trust để pull secret runtime, không lưu trong env CI.
- Rotate db password / api key 90 ngày.

## 8. Audit logging

Mọi thao tác sau bắt buộc audit:
- Login / logout / 2FA enable.
- Role change / permission grant / user invite.
- Branch create/update/delete.
- Service price change.
- Booking create/cancel/refund.
- Payment / refund.
- Export dữ liệu khách hàng.

Schema: `actor_id, action, entity_type, entity_id, before JSONB, after JSONB, ip, ua, ts`.

## 9. Compliance

- Chuẩn bị cho Nghị định 13/2023 (Việt Nam) về bảo vệ dữ liệu cá nhân:
  - Đồng ý xử lý, có thể rút lại.
  - Yêu cầu xoá / xuất dữ liệu (DSR endpoints).
  - DPO contact ở footer.
- Khi mở thị trường khác: GDPR (EU), PIPEDA (Canada) – giữ kiến trúc data-residency-aware.

## 10. Process

- Pull request bắt buộc 1 reviewer + pass `security-review` skill cho thay đổi nhạy cảm.
- Dependabot / Renovate auto PR vá CVE.
- Pen-test bên thứ ba mỗi 12 tháng.
