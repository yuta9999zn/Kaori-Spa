import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import BookingHistoryView from './BookingHistoryView';

export default async function BookingHistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('booking');
  return (
    <>
      <SubNav items={subNavItems} />
      <BookingHistoryView />
    </>
  );
}
