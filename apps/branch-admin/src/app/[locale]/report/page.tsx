import { setRequestLocale } from 'next-intl/server';
import ReportView from './ReportView';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function ReportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('report');
  return (
    <>
      <SubNav items={items} />
      <ReportView />
    </>
  );
}
