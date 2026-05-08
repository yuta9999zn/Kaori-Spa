# Bảng giá thật — Kaori Spa (seed data)

> Nguồn: user cung cấp 2026-05-06. Đây là **canonical source** cho seed DB và file `data-seed/services.json`. Khi bảng giá thực tế thay đổi, sửa file này trước.

Đơn vị: VND. `is_combo` = true với gói nhiều buổi. `gender` = `male` | `female` | `unisex`. `region` = vùng cơ thể (`face`, `arm`, `chest`, `belly`, `back`, `vio`, `leg`, `full_body`, `beauty`).

## 1. Triệt lông NAM

| code | name (vi) | gender | region | duration_min | price | is_combo | sessions |
|---|---|---|---|---|---|---|---|
| `male_arm_upper` | Triệt Bắp Tay | male | arm | 30 | 250000 | false | 1 |
| `male_arm_lower_hand` | Triệt Cẳng Tay Và Bàn Tay | male | arm | 40 | 300000 | false | 1 |
| `male_underarm` | Triệt Nách | male | arm | 15 | 50000 | false | 1 |
| `male_chest` | Triệt Ngực | male | chest | 30 | 250000 | false | 1 |
| `male_belly` | Triệt Bụng (không bao gồm vùng quanh rốn) | male | belly | 30 | 250000 | false | 1 |
| `male_navel_around` | Triệt Quanh Rốn | male | belly | 20 | 250000 | false | 1 |
| `male_back` | Triệt Lưng | male | back | 40 | 250000 | false | 1 |
| `male_lower_back` | Triệt Thắt Lưng | male | back | 30 | 250000 | false | 1 |
| `male_butt` | Triệt Mông | male | back | 30 | 250000 | false | 1 |
| `male_vio_part` | Triệt V-I-O (giá từng vùng) | male | vio | 30 | 500000 | false | 1 |
| `male_vio_combo` | Triệt V-I-O (giá combo 3 vùng) | male | vio | 60 | 1000000 | true | 1 |
| `male_thigh_upper_knee` | Triệt Đùi Trên Đầu Gối | male | leg | 40 | 250000 | false | 1 |
| `male_calf_foot` | Triệt Bắp Chân Và Bàn Chân | male | leg | 40 | 300000 | false | 1 |
| `male_full_body` | Triệt Toàn Thân (không gồm Mặt và VIO) | male | full_body | 120 | 1600000 | true | 1 |
| `male_combo10_vio` | Combo 10 buổi VIO | male | vio | 60 | 9000000 | true | 10 |
| `male_combo10_face` | Combo 10 buổi Mặt | male | face | 30 | 15000000 | true | 10 |
| `male_combo10_full_body` | Combo 10 buổi Toàn Thân | male | full_body | 120 | 15000000 | true | 10 |
| `male_mustache` | Triệt Ria Mép | male | face | 15 | 600000 | false | 1 |
| `male_face` | Triệt Mặt | male | face | 30 | 1600000 | false | 1 |
| `male_cheek` | Triệt Má | male | face | 20 | 600000 | false | 1 |
| `male_chin` | Triệt Cằm | male | face | 15 | 600000 | false | 1 |
| `male_sideburns` | Triệt Mai Tóc | male | face | 20 | 600000 | false | 1 |
| `male_nape` | Triệt Lông Sau Gáy | male | face | 20 | 300000 | false | 1 |

## 2. Triệt lông NỮ

| code | name (vi) | gender | region | duration_min | price | is_combo | sessions |
|---|---|---|---|---|---|---|---|
| `female_mustache` | Triệt Ria Mép | female | face | 15 | 500000 | false | 1 |
| `female_face` | Triệt Mặt | female | face | 30 | 1500000 | false | 1 |
| `female_cheek` | Triệt Má | female | face | 20 | 500000 | false | 1 |
| `female_chin` | Triệt Cằm | female | face | 15 | 500000 | false | 1 |
| `female_sideburns` | Triệt Mai Tóc | female | face | 20 | 500000 | false | 1 |
| `female_arm_lower_hand` | Triệt Cẳng Tay Và Bàn Tay | female | arm | 40 | 200000 | false | 1 |
| `female_arm_upper` | Triệt Bắp Tay | female | arm | 30 | 150000 | false | 1 |
| `female_underarm` | Triệt Nách | female | arm | 15 | 20000 | false | 1 |
| `female_chest` | Triệt Ngực | female | chest | 30 | 150000 | false | 1 |
| `female_belly` | Triệt Bụng (không bao gồm vùng quanh rốn) | female | belly | 30 | 150000 | false | 1 |
| `female_navel_around` | Triệt Quanh Rốn | female | belly | 20 | 150000 | false | 1 |
| `female_back` | Triệt Lưng | female | back | 40 | 150000 | false | 1 |
| `female_lower_back` | Triệt Thắt Lưng | female | back | 30 | 150000 | false | 1 |
| `female_butt` | Triệt Mông | female | back | 30 | 150000 | false | 1 |
| `female_vio_part` | Triệt V-I-O (giá từng vùng) | female | vio | 30 | 300000 | false | 1 |
| `female_vio_combo` | Triệt V-I-O (giá combo 3 vùng) | female | vio | 60 | 600000 | true | 1 |
| `female_thigh_upper_knee` | Triệt Đùi Trên Đầu Gối | female | leg | 40 | 150000 | false | 1 |
| `female_calf_foot` | Triệt Bắp Chân Và Bàn Chân | female | leg | 40 | 200000 | false | 1 |
| `female_full_body` | Triệt Toàn Thân (không gồm Mặt và VIO) | female | full_body | 120 | 1000000 | true | 1 |
| `female_combo10_vio` | Combo 10 buổi VIO | female | vio | 60 | 5400000 | true | 10 |
| `female_combo10_face` | Combo 10 buổi Mặt | female | face | 30 | 12000000 | true | 10 |
| `female_combo10_full_body` | Combo 10 buổi Toàn Thân | female | full_body | 120 | 8000000 | true | 10 |
| `female_nape` | Triệt Lông Sau Gáy | female | face | 20 | 200000 | false | 1 |

## 3. Dịch vụ làm đẹp (Nam & Nữ)

| code | name (vi) | gender | region | duration_min | price | is_combo |
|---|---|---|---|---|---|---|
| `beauty_intimate_care` | Làm Đẹp Vùng Kín (thu hẹp, khoẻ mạnh âm đạo) | unisex | beauty | 45 | 300000 | false |
| `beauty_skin_rejuvenation` | Trẻ Hoá Da Bằng Công Nghệ Ánh Sáng | unisex | beauty | 45 | 300000 | false |
| `beauty_yomogi_steam` | Xông Thảo Dược Yomogi | unisex | beauty | 30 | 500000 | false |
| `beauty_set_3_vip` | Set Làm Đẹp 3 Dịch Vụ (phòng VIP) | unisex | beauty | 120 | 2100000 | true |

## 4. Quy ước

- Giá là `base_price` cấp `org`. Branch override qua `service_branch_prices` khi cần.
- Field `name` ở DB lưu `JSONB` đa ngôn ngữ; khi seed sẽ thêm bản dịch `en/ja/zh/ko` qua `ai-service` hoặc bản dịch tay (recommended cho top services).
- Combo 10 buổi quản lý qua bảng `combos` + `combo_items` (1 item, sessions = 10).
- VIO combo 3 vùng quản lý qua `combos` (1 buổi gộp 3 vùng V-I-O).

## 5. Format JSON xuất ra

Khi seeder chạy, sinh file `data-seed/services.json` cấu trúc:

```json
[
  {
    "code": "male_arm_upper",
    "name": { "vi": "Triệt Bắp Tay", "en": "Upper Arm Hair Removal" },
    "gender": "male",
    "region": "arm",
    "duration_min": 30,
    "base_price": 250000,
    "currency": "VND",
    "is_combo": false,
    "sessions": 1
  }
]
```
