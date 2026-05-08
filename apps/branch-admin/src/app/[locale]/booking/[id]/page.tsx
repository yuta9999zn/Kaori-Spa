import { setRequestLocale } from 'next-intl/server';
import BookingDetail from './BookingDetail';

export default async function BookingDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <BookingDetail id={id} />;
}
