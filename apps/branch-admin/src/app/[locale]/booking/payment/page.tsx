import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import BookingPaymentView from './BookingPaymentView';

export default async function BookingPaymentPage({
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
      <BookingPaymentView />
    </>
  );
}
