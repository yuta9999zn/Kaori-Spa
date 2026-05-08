import { setRequestLocale } from 'next-intl/server';
import QuickBook from './QuickBook';
import type { Locale } from '@/i18n/routing';

export default async function QuickBookPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string; branch?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  return <QuickBook
    locale={locale as Locale}
    initialService={sp.service}
    initialBranch={sp.branch}
  />;
}
