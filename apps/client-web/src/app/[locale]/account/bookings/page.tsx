import { setRequestLocale } from 'next-intl/server';
import BookingHistory from './BookingHistory';

export default async function BookingsHistoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <section className="container-prose py-12">
      <BookingHistory locale={locale} />
    </section>
  );
}
