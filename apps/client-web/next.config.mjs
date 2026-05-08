import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  // PWA disabled in dev so HMR isn't shadowed by SW caching.
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  fallbacks: {
    document: '/offline'
  },
  workboxOptions: {
    runtimeCaching: [
      // Static Next.js assets — long cache, immutable.
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
        }
      },
      // Locale messages — refresh in background.
      {
        urlPattern: /\/messages\/.*\.json$/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'i18n-messages' }
      },
      // Public catalog APIs — fall back to cache when offline.
      {
        urlPattern: /\/v1\/(public\/orgs|services|branches)/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-public',
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }
        }
      },
      // Booking endpoints must always go to network.
      {
        urlPattern: /\/v1\/(bookings|payments|auth)/,
        handler: 'NetworkOnly'
      }
    ]
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.kaorispa.io' }
    ]
  }
};

export default withPWA(withNextIntl(nextConfig));
