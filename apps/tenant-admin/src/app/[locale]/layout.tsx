import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { AuthProvider } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';

export function generateStaticParams() { return routing.locales.map(locale => ({ locale })); }

export default async function LocaleLayout({
  children, params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            <AuthGate>{children}</AuthGate>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
