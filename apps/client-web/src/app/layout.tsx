import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://natural.kaorispa.io'),
  title: {
    default: 'Natural Beauty | Kaori Spa Platform',
    template: '%s | Natural Beauty'
  },
  description: 'Natural Beauty — premium hair removal & skin care, powered by Kaori.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#C9A87C',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
