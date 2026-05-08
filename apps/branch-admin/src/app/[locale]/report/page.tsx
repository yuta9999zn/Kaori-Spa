import { setRequestLocale } from 'next-intl/server';
import ReportView from './ReportView';

export default async function ReportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReportView />;
}
