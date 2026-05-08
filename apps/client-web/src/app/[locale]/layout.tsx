import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Cinzel, Jost } from 'next/font/google';
import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import { CustomerAuthProvider } from '@/lib/auth';

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '500', '600', '700'] });
const jost = Jost({ subsets: ['latin'], variable: '--font-jost', weight: ['300', '400', '500', '600'] });

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) return {};
  const t = await getTranslations({ locale, namespace: 'home' });
  const tBrand = await getTranslations({ locale, namespace: 'brand' });

  const title = `${tBrand('tenant')} — ${t('heroTitle')}`;
  const description = t('heroSubtitle');
  const baseUrl = 'https://natural.kaorispa.io';

  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map(l => [l, `${baseUrl}/${l}`])
  );
  languages['x-default'] = `${baseUrl}/${routing.defaultLocale}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: tBrand('tenant'),
      locale,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${cinzel.variable} ${jost.variable}`}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <CustomerAuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </CustomerAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
