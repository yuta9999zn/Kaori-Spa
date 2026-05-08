# Realtime — WebSocket + Kafka

## 1. Use case

| # | Use case | Latency mục tiêu |
|---|---|---|
| 1 | Lễ tân thấy booking mới ngay khi khách đặt online | < 1s |
| 2 | Calendar nhân viên đồng bộ khi có sửa lịch | < 1s |
| 3 | Thông báo in-app (đặt cọc, tin nhắn AI, alert tồn kho) | < 2s |
| 4 | Dashboard doanh thu cập nhật khi có giao dịch | < 5s |
| 5 | Chatbot streaming token | < 200ms / token |

## 2. Kiến trúc

```
Service A ──▶ Kafka topic ──▶ Realtime Gateway ──▶ WebSocket clients
                                  ▲
                                  │ subscribe by (tenant, branch, channel)
```

- Realtime Gateway: Spring Reactive (WebFlux) hoặc Node.js (Socket.IO). Phía khách dùng `socket.io-client` để hỗ trợ fallback.
- Mỗi connection mang JWT → resolve `(tenant_id, user_id, scopes)` → join các room phù hợp.
- Kafka consumer group của gateway broadcast theo room mapping.

## 3. Channel & room naming

```
t:{tenantId}:o:{orgId}:b:{branchId}:bookings
t:{tenantId}:u:{userId}:notifications
t:{tenantId}:b:{branchId}:dashboard
t:{tenantId}:conversations:{conversationId}
```

- Phân quyền join: gateway check user có scope phù hợp; nếu không, từ chối.

## 4. Sự kiện chính

| Topic Kafka | Payload | Room WS |
|---|---|---|
| `kaori.booking.created.v1` | bookingId, branchId, customerId, slot | `…:bookings` |
| `kaori.booking.updated.v1` | bookingId, fields | `…:bookings` |
| `kaori.payment.completed.v1` | bookingId, amount | `…:dashboard` |
| `kaori.notification.created.v1` | notificationId | `…:u:{userId}:notifications` |
| `kaori.ai.token.v1` | conversationId, delta | `…:conversations:{id}` |

## 5. Backpressure & reliability

- WebSocket gateway dùng RxJava/Reactor để áp dụng buffer + drop oldest khi client chậm.
- Client có cơ chế resume bằng `lastEventId`; nếu mất kết nối > 30s → gateway gọi REST `GET /events?since=` để bù missing event.
- Idempotency: client mark đã apply theo `eventId`.

## 6. Scale

- Sticky session bằng `tenant_id` hash → cùng tenant cùng node giúp giảm fan-out chéo.
- Hoặc dùng Redis Pub/Sub layer giữa các node gateway nếu chạy cluster lớn.
- Metric quan trọng: `ws_connections`, `ws_msg_per_sec`, `ws_drop_count`, `lag_ms`.

## 7. Fallback

Nếu WebSocket bị chặn (corporate firewall):
1. Long-polling fallback (Socket.IO tự xử lý).
2. Worst-case: client poll `/events?since=` mỗi 5s.

## 8. Test

- Integration: spin up 2 node gateway + Kafka, gửi event → assert nhận đủ ở cả 2.
- Load: k6 với `k6/x/websockets` 5k connection, 50 msg/s/connection.
