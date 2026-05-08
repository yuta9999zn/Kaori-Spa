import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Natural Beauty — Kaori',
    short_name: 'Natural Beauty',
    description: 'Natural Beauty premium hair removal & skin care',
    start_url: '/vi',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF9F6',
    theme_color: '#C9A87C',
    lang: 'vi',
    categories: ['lifestyle', 'health', 'beauty'],
    icons: [
      { src: '/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
}
