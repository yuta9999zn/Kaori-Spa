# @kaori/client-web

Trang công khai cho từng tổ chức (tenant). Hiện cấu hình cho **Natural Beauty** với 2 chi nhánh:

- 575 Kim Mã, Ba Đình, Hà Nội
- 625 Kim Mã, Ba Đình, Hà Nội

## Tính năng

- Next.js 14 App Router + TypeScript + Tailwind.
- i18n 5 ngôn ngữ qua `next-intl`: `vi` (mặc định), `en`, `ja`, `zh`, `ko`.
- Bảng dịch vụ đầy đủ với giá thật từ `/docs/pricing.md`.
- Trang: Home, Services (có bộ lọc), Branches, Booking (4 bước), About, Contact.
- Brand token Tailwind: `brand-gold #C9A87C`, `brand-rose #D9B8B5`, `brand-cream`, …
- Component reusable: `Header`, `Footer`, `LocaleSwitcher`, `ServicesGrid`, `BookingFlow`.

## Chạy dev

```bash
cd apps/client-web
pnpm install
pnpm dev
# mở http://localhost:3003 (auto redirect /vi)
```

## Cấu trúc

```
apps/client-web/
├── messages/              # 5 file i18n
│   ├── vi.json            # nguồn chính
│   ├── en.json
│   ├── ja.json
│   ├── zh.json
│   └── ko.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx       # redirect → /vi
│   │   ├── not-found.tsx
│   │   └── [locale]/
│   │       ├── layout.tsx
│   │       ├── page.tsx           # Home
│   │       ├── services/page.tsx
│   │       ├── branches/page.tsx
│   │       ├── booking/page.tsx
│   │       ├── about/page.tsx
│   │       └── contact/page.tsx
│   ├── components/        # Header, Footer, BookingFlow, ServicesGrid, …
│   ├── data/              # tenant, branches, services (seed)
│   ├── i18n/              # routing.ts, request.ts
│   ├── lib/               # cn, format
│   └── middleware.ts      # locale prefix detect
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## Bước tiếp theo (chưa làm trong phiên này)

- Kết nối API thật khi backend M1 lên: thay seed `data/services.ts` + `data/branches.ts` bằng fetch.
- Form đặt lịch hiện chỉ là mock UI — cần `POST /v1/bookings` ở backend.
- Form contact: gửi tới `notification-service`.
- Test: Vitest + Playwright.
- Auth khách hàng: trang đăng nhập, lịch sử đặt, hồ sơ.
- Chatbot widget khi `ai-service` lên (M4).
