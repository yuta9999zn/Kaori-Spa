import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import NewBooking from './NewBooking';

export default async function NewBookingPage({
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
      <NewBooking />
    </>
  );
}
