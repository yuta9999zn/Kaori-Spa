import { setRequestLocale } from 'next-intl/server';
import AnalyticsView from './AnalyticsView';

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AnalyticsView />;
}
