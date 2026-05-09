import { setRequestLocale } from 'next-intl/server';
import BookingList from './BookingList';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function BookingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('booking');
  return (
    <>
      <SubNav items={items} />
      <BookingList />
    </>
  );
}
