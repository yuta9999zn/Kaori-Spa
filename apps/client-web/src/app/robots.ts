import type { MetadataRoute } from 'next';

const BASE = 'https://natural.kaorispa.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/_next/'] }
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE
  };
}
