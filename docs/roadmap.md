# Roadmap triển khai — Kaori Spa Platform

> Lộ trình 5 mốc, dồn rủi ro về sớm. Mỗi mốc có Definition of Done rõ ràng.

## M0 — Foundation (1 tuần)
**Mục tiêu:** dựng skeleton chạy được, có CI, có 1 endpoint health, có 1 page hello.

- [ ] Khởi tạo monorepo (`pnpm`, `turbo`), cấu hình ESLint/TS/Tailwind chung.
- [ ] Khởi tạo Spring Boot multi-module (`auth-service`, `tenant-service`).
- [ ] Khởi tạo Python `ai-service` (FastAPI + Poetry).
- [ ] Docker compose: Postgres, Redis, Kafka, Zookeeper, ClickHouse, MinIO.
- [ ] CI: GitHub Actions chạy lint + test + build cho FE & BE.
- [ ] Tạo `packages/i18n` với 5 file rỗng `{en,vi,ja,zh,ko}.json`.

**DoD:** `docker compose up` xong, `pnpm dev` mở 4 portal, `curl /health` của mọi service trả 200.

## M1 — Tenant + Auth + RBAC (2 tuần)
**Mục tiêu:** đăng ký tổ chức, đăng nhập, phân quyền hoạt động được.

- [ ] Schema: `tenants`, `organizations`, `branches`, `users`, `roles`, `permissions`, `user_roles`, `audit_events`.
- [ ] Auth: OAuth2 password + refresh, 2FA TOTP, password reset.
- [ ] RBAC: matrix permission như `docs/rbac.md`. PermissionGuard.
- [ ] Tenant Admin portal: trang đăng ký tổ chức, duyệt tenant, gán gói.
- [ ] Org Admin portal: tạo branch, mời manager, gán role.
- [ ] Audit log cơ bản (login, role-change, branch-create).
- [ ] i18n hoá toàn bộ UI mới với 5 ngôn ngữ.

**DoD:** Tạo tổ chức "Natural Beauty" → tạo 2 branch → mời 1 manager → manager đăng nhập, vào đúng branch, chỉ thấy menu được phân quyền.

## M2 — Catalog + Booking + Customer (3 tuần)
**Mục tiêu:** vận hành nghiệp vụ chính của 1 chi nhánh.

- [ ] Catalog: dịch vụ, danh mục, gói combo, giá theo branch (override). Seed `docs/pricing.md`.
- [ ] Phòng + lịch phòng, thiết bị.
- [ ] Nhân viên: hồ sơ, kỹ năng, ca làm, hoa hồng.
- [ ] Khách hàng: hồ sơ, ghi chú sức khoẻ, phân khúc, điểm thưởng.
- [ ] Booking: tạo / sửa / huỷ / check-in / xung đột phòng-nhân viên.
- [ ] Realtime calendar (WebSocket) cho lễ tân.
- [ ] Thanh toán (tiền mặt / chuyển khoản / thẻ).
- [ ] Test E2E: flow đặt lịch → check-in → thanh toán.

**DoD:** Lễ tân có thể vận hành 1 ngày làm việc trên hệ thống không cần dùng giấy/Excel.

## M3 — Inventory + Notification + Reports (2 tuần)

- [ ] Kho: sản phẩm, nhập / xuất, tồn kho theo branch.
- [ ] Notification: email + SMS + push + in-app, template đa ngôn ngữ.
- [ ] Báo cáo branch: doanh thu ngày / tháng, hiệu suất nhân viên, phân tích booking.
- [ ] Báo cáo org: tổng hợp đa chi nhánh.
- [ ] Audit log đầy đủ (mọi thay đổi entity quan trọng).
- [ ] Logging structured + Grafana dashboard.

**DoD:** Chủ tổ chức xem được báo cáo đa chi nhánh; Tenant admin xem được audit toàn hệ thống.

## M4 — AI + Chatbot + Analytics (3 tuần)

- [ ] LLM gateway (rate-limit, cost tracking, multi-provider).
- [ ] Chatbot khách hàng: tư vấn dịch vụ, đặt lịch, FAQ — đa ngôn ngữ.
- [ ] Trợ lý nội bộ: tóm tắt khách hàng, gợi ý upsell.
- [ ] Recommendation: gợi ý dịch vụ cho khách dựa trên lịch sử.
- [ ] Analytics realtime: ClickHouse + Grafana cho ban quản trị.
- [ ] Vector search: tìm kiếm semantic trong khách hàng & nội dung.

**DoD:** Chatbot đặt lịch thành công cho khách qua website; manager nhận tóm tắt khách hàng AI khi mở hồ sơ.

## M5 — Hardening + Go-live (2 tuần)

- [ ] Pen-test, OWASP top 10 review.
- [ ] Load test (k6) đạt 1000 booking/phút trên test env.
- [ ] Backup & restore drill.
- [ ] Disaster recovery playbook.
- [ ] Helm chart + production K8s deploy.
- [ ] Onboarding doc cho tổ chức mới.

**DoD:** Production deploy stable 7 ngày, SLO uptime ≥ 99.5%.

---

## Ưu tiên trong chat hiện tại

Phiên này tôi sẽ làm xong **M0** + một phần **M1** (skeleton tenant/auth/i18n) vì còn rất nhiều việc. Các mốc còn lại sẽ làm tiếp ở các phiên sau theo thứ tự trên.
