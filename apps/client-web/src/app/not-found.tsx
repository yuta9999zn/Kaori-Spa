import Link from 'next/link';
import { defaultLocale } from '@/i18n/routing';

export default function NotFound() {
  return (
    <html lang={defaultLocale}>
      <body className="min-h-screen flex flex-col items-center justify-center bg-brand-ivory text-brand-textmain font-sans">
        <h1 className="font-serif text-5xl mb-3">404</h1>
        <p className="text-brand-textmuted mb-6">Page not found</p>
        <Link href={`/${defaultLocale}`} className="btn-primary">
          Home
        </Link>
      </body>
    </html>
  );
}
