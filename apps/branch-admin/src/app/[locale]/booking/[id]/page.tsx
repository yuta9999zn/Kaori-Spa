import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import BookingDetail from './BookingDetail';

export default async function BookingDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('booking');
  return (
    <>
      <SubNav items={subNavItems} />
      <BookingDetail id={id} />
    </>
  );
}
