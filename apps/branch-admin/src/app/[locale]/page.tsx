import { setRequestLocale } from 'next-intl/server';
import DashboardView from './DashboardView';

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardView locale={locale} />;
}
