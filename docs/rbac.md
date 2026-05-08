# RBAC — Role-Based Access Control

## 1. Mô hình

- **Scope**: `tenant` | `org` | `branch`. Một role có scope cố định.
- **Role**: tập hợp `permission_code`. Người dùng nhận `(role, scope_id)` qua bảng `user_roles`.
- **Permission code** dạng `domain:action`, vd: `booking:create`, `customer:read`, `staff:salary:write`.
- Quyết định = AND giữa 3 lớp: role có quyền → scope khớp tổ chức / chi nhánh người dùng đang truy cập → tenant người dùng = tenant resource.

## 2. Role mặc định

| Code | Scope | Tóm tắt |
|---|---|---|
| `SUPER_ADMIN` | tenant | Toàn quyền nền tảng (chỉ Kaori platform staff) |
| `TENANT_OWNER` | tenant | Chủ tenant — quản trị tổ chức + billing |
| `ORG_OWNER` | org | Chủ tổ chức — toàn bộ org |
| `ORG_MANAGER` | org | Quản lý đa chi nhánh |
| `BRANCH_MANAGER` | branch | Quản lý 1 chi nhánh |
| `RECEPTIONIST` | branch | Lễ tân (booking, check-in, thanh toán) |
| `THERAPIST` | branch | Kỹ thuật viên (xem lịch của mình, ghi chú) |
| `ACCOUNTANT` | org | Kế toán (báo cáo, không sửa lịch) |
| `MARKETING` | org | Quản lý nội dung, khuyến mãi |
| `CUSTOMER` | tenant | Khách hàng cuối (đặt lịch qua client web) |

## 3. Ma trận quyền (rút gọn)

Đầy đủ trong mockup `quan-ly-to-chuc/ma-tran-quyen.html`. Ví dụ:

| Permission | TENANT_OWNER | ORG_OWNER | BRANCH_MANAGER | RECEPTIONIST | THERAPIST |
|---|:-:|:-:|:-:|:-:|:-:|
| `org:read` | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) |
| `branch:create` | ✅ | ✅ | – | – | – |
| `staff:create` | ✅ | ✅ | ✅ | – | – |
| `staff:salary:read` | ✅ | ✅ | ✅ (own branch) | – | own only |
| `customer:read` | ✅ | ✅ | ✅ | ✅ | ✅ (booked) |
| `customer:health_note:write` | – | ✅ | ✅ | – | ✅ |
| `booking:create` | ✅ | ✅ | ✅ | ✅ | – |
| `booking:cancel` | ✅ | ✅ | ✅ | ✅ | – |
| `payment:create` | ✅ | ✅ | ✅ | ✅ | – |
| `report:branch` | ✅ | ✅ | ✅ | – | – |
| `report:org` | ✅ | ✅ | – | – | – |
| `audit:read` | ✅ | ✅ | – | – | – |
| `setting:integration` | ✅ | ✅ | – | – | – |
| `ai:assist` | ✅ | ✅ | ✅ | ✅ | ✅ |

## 4. Áp dụng trong code

### Java
```java
@PreAuthorize("@perm.has(#root, 'booking:create', 'branch')")
@PostMapping("/bookings")
public ApiResponse<BookingDto> create(...) { ... }
```

`PermissionEvaluator` đọc `tid/oid/bid/perms` từ JWT và đối chiếu scope của resource (lấy từ path variable hoặc body validated).

### Frontend
```ts
const { can } = useAuth();
{can('booking:create', { branchId }) && <Button>Tạo booking</Button>}
```

Không phụ thuộc vào FE để bảo vệ — chỉ là UX. Backend luôn tự kiểm.

## 5. Tenant isolation

- Mỗi request bắt buộc có `tenant_id` resolved từ JWT (không trust header).
- Hibernate filter `tenant_filter` enable mặc định → mọi query auto thêm `WHERE tenant_id = :tid`.
- Test riêng `TenantIsolationContractTest` cho mọi repository: tạo dữ liệu tenant A → đăng nhập tenant B → đảm bảo 0 row trả về.

## 6. Audit

Mọi mutation API gắn aspect `@Audited(action = "...", entityType = "...")` → đẩy event `kaori.audit.event.v1` → `audit-service` → ClickHouse `fact_audit_events`.
