# Natural Beauty mobile shell

Capacitor 6 wrapper around `apps/client-web`. Same Next.js bundle as the web — published as native binaries to App Store / Google Play for customers who prefer an installable app.

## Architecture

```
┌──────────────────────┐
│ iOS / Android binary │   (this folder)
└──────────┬───────────┘
           │ WebView load
           ▼
┌──────────────────────┐
│ client-web (Next.js) │   (../client-web)
│ deployed at          │
│ natural.kaorispa.io  │
└──────────────────────┘
```

The native shell adds:
- **Splash screen** with brand colors (1.2s).
- **Push notifications** for booking reminders + promotion campaigns.
- **Biometric auth** (FaceID / TouchID / fingerprint) for repeat login. (TODO: install `@capacitor-community/biometric-auth`.)
- **Native share sheet** when user shares a booking confirmation.
- **Status-bar theming** matching brand cream.

## Setup

```bash
cd apps/client-mobile
pnpm install
npx cap add ios
npx cap add android
pnpm sync
pnpm ios:open       # opens Xcode
pnpm android:open   # opens Android Studio
```

For local development against a Next dev server:

```bash
CAP_SERVER_URL=http://10.0.2.2:3003 pnpm sync   # Android emulator
CAP_SERVER_URL=http://localhost:3003 pnpm sync   # iOS simulator
```

## Why a remote server URL

We load `https://natural.kaorispa.io` directly so all customer-facing content (services, prices, branches) updates immediately without an app store review. This is allowed under both App Store and Google Play guidelines as long as the WebView shows owned content (it does — the same Next.js app served by HTTPS). Native plugins (push, biometric) bridge to the WebView via Capacitor's `window.Capacitor` runtime.

## Next steps

- Add `@capacitor-community/biometric-auth` for fingerprint login.
- Wire push token registration with the backend `notification-service`.
- Add deep links: `naturalbeauty://booking/BK-2026-001` opens the booking detail screen directly.
- Submit to App Store + Google Play (need brand assets + privacy policy URL).
