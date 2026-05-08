import { setRequestLocale } from 'next-intl/server';
import BookingList from './BookingList';

export default async function BookingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingList />;
}
