import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell for the Natural Beauty client website.
 *
 * In production (release builds) the app loads from `https://natural.kaorispa.io`
 * — this lets us roll out content updates without resubmitting to the App Store.
 * In dev / staging the `server.url` env points to a local Next.js dev server so
 * QA can test against new code without rebuilding the native binary.
 */
const config: CapacitorConfig = {
  appId: 'vn.kaori.naturalbeauty',
  appName: 'Natural Beauty',
  webDir: '../client-web/.next-export',  // Optional: when client-web is statically exported
  server: {
    url: process.env.CAP_SERVER_URL ?? 'https://natural.kaorispa.io',
    cleartext: false,
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#FAF9F6'
  },
  android: {
    backgroundColor: '#FAF9F6'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#FAF9F6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      backgroundColor: '#FAF9F6',
      style: 'LIGHT'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
