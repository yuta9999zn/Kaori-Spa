import { setRequestLocale } from 'next-intl/server';
import WeekCalendar from './WeekCalendar';

export default async function CalendarPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WeekCalendar />;
}
