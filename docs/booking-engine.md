# Booking engine — Kaori Spa

## 0. Hai luồng đặt lịch

| Đối tượng | App | Endpoint | Auth | Đặc điểm |
|---|---|---|---|---|
| Nhân viên đặt cho khách | **branch-admin** `/booking/new` | `POST /v1/bookings` | Bearer JWT | Search khách / tạo mới, chọn dịch vụ, gọi `/availability/search`, **chọn bed + KTV thủ công**. |
| Khách tự đặt online | **client-web** `/booking` | `POST /v1/public/bookings` | Public | Khách chọn chi nhánh + dịch vụ + ngày/giờ. **Backend tự pick** bed + KTV qua `availability.search()` (tolerance ±5 phút). |

Cả hai cùng đi qua `BookingService.create()` nên các bảo vệ chống trùng giường + KTV + ca làm việc áp dụng như nhau. `bookings.source` lưu kênh: `walkin / phone / admin / web / ai / partner`.

## 1. Mục tiêu

Bảo vệ tuyệt đối việc trùng giường / trùng nhân viên / ngoài ca, kể cả khi có concurrency cao và nhiều client đặt cùng lúc.

## 2. Phân cấp

```
Branch (chi nhánh)
└── Room (phòng)
    └── Bed (giường)         ← unit khoá thực sự
```

Một phòng có thể chứa nhiều giường — phục vụ nhiều khách cùng lúc trên cùng phòng.

## 3. 3 lớp bảo vệ trùng lịch

| Lớp | Cấp | Tác dụng |
|---|---|---|
| 1. App pre-check | `BookingService.preCheck` | Trả lỗi rõ ràng UX. |
| 2. DB exclusion (giường) | `excl_bed_no_overlap` GIST | Chống race khi 2 request đến cùng giường cùng giờ. |
| 3. DB exclusion (nhân viên) | `excl_staff_no_overlap` GIST | Chống race khi 2 request gán cùng KTV. |

```sql
ALTER TABLE booking_items
    ADD CONSTRAINT excl_bed_no_overlap
    EXCLUDE USING gist (
        bed_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    )
    WHERE (cancelled_at IS NULL AND status NOT IN ('cancelled', 'no_show'));
```

`tstzrange` half-open `'[)'` cho phép back-to-back booking (booking A kết thúc 10:30, B bắt đầu 10:30 không xung đột).

Khi booking bị huỷ, trigger `sync_item_status()` cập nhật `cancelled_at` ở items → slot lập tức free.

## 4. Ca làm việc (shift)

Theo file Excel khách hàng:

| Code | JP | VN | Giờ |
|---|---|---|---|
| `SANG` | 早番 | SÁNG | 09:00-15:00 |
| `TOI` | 遅番 | TỐI | 15:00-21:00 |
| `FULL` | ロング | FULL | 09:00-21:00 |
| `NGHI` | 休み | NGHỈ | nghỉ |

`ShiftChecker` được dùng trong `BookingService.preCheck`:
- Booking time phải **nằm trọn** trong ca làm việc của KTV.
- Có ca `NGHI` overlap → từ chối.
- Không có ca → từ chối (KTV chưa được phân ca ngày đó).

## 5. Chấm công

Bảng `attendance_records` (1 row / staff / day). Trạng thái:

| Status | Khi nào |
|---|---|
| `scheduled` | Đã có ca, chưa đến giờ |
| `present` | Vào ca trước hoặc đúng giờ (grace 10 phút) |
| `late` | Vào ca sau giờ + grace |
| `absent` | Hết ca không vào — set bởi nightly job |
| `early_out` | Tan ca trước giờ + grace |
| `off` | `shift_type = NGHI` |
| `no_shift` | Không có ca |

Endpoint:
- `POST /v1/attendance/check-in`
- `POST /v1/attendance/check-out`
- `GET /v1/attendance?branchId&date`

## 6. Availability search

`GET /v1/availability/search` trả về danh sách slot khả dụng:
- Snap window về lưới (default 30 phút).
- Loại bed bị chiếm theo `start_at/end_at` overlap.
- Pick KTV đang trên ca + có skill cho service đó (`staff_skills`).

## 7. Idempotency

`POST /v1/bookings` chấp nhận header `Idempotency-Key`. Nếu gửi lại cùng key + cùng `tenant_id` → trả booking đã tạo (không duplicate).

## 8. Outbox event

Sau khi tạo booking thành công, ghi row vào `outbox_events`:
- `kaori.booking.created.v1` → notification-service + realtime-gateway + analytics.
- `kaori.booking.cancelled.v1` khi huỷ.

`OutboxPublisher` ở shared-kernel poll mỗi 500ms publish lên Kafka.

## 9. Test

`BookingConflictIT` (Testcontainers Postgres):
- ✓ Không thể đặt cùng giường, time overlap.
- ✓ Có thể đặt back-to-back trên cùng giường.
- ✓ Không thể gán cùng KTV cho 2 giường khác nhau cùng giờ.
- (todo) Không thể gán KTV ngoài ca làm việc.

## 10. Phía Frontend

- **Branch admin** `/staff/shifts`: lưới tháng, click ô để cycle SANG → TOI → FULL → NGHI → trống. Footer mỗi hàng đếm tổng.
- **Branch admin** `/staff/attendance`: bảng nhân viên hôm nay với nút Vào ca / Tan ca; status badge.
- **Branch admin** `/booking` (todo): khi tạo booking, gọi `/availability/search` rồi cho lễ tân pick slot.
- **Client web** `/booking`: hiện tại UI mock; bước kế tiếp wire vào `/availability/search` + `POST /v1/bookings`.
