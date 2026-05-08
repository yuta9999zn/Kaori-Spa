import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';

const BASE = 'https://natural.kaorispa.io';
const ROUTES = ['', '/services', '/branches', '/booking', '/about', '/contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.flatMap(path =>
    locales.map(l => ({
      url: `${BASE}/${l}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(locales.map(ll => [ll, `${BASE}/${ll}${path}`]))
      }
    }))
  );
}
