import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import CustomerBookingHistoryView from './CustomerBookingHistoryView';

export default async function CustomerBookingHistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  return (
    <>
      <SubNav items={subNavItems} />
      <CustomerBookingHistoryView />
    </>
  );
}
