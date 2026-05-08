import { setRequestLocale } from 'next-intl/server';
import NewBooking from './NewBooking';

export default async function NewBookingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NewBooking />;
}
