import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import ReportDailyView from './ReportDailyView';

export default async function ReportDailyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('report');
  return (
    <>
      <SubNav items={subNavItems} />
      <ReportDailyView />
    </>
  );
}
