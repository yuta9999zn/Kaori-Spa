import { setRequestLocale } from 'next-intl/server';
import RevenueReport from './RevenueReport';

export default async function ReportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RevenueReport />;
}
