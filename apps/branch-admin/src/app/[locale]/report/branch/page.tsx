import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import ReportBranchView from './ReportBranchView';

export default async function ReportBranchPage({
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
      <ReportBranchView />
    </>
  );
}
