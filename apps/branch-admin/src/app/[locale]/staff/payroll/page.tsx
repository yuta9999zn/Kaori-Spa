import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import PayrollTable from './PayrollTable';

export default async function PayrollPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('staff');
  return (
    <>
      <SubNav items={subNavItems} />
      <PayrollTable />
    </>
  );
}
