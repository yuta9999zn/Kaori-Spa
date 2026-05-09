import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import RoomCalendarView from './RoomCalendarView';

export default async function RoomCalendarPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('room');
  return (
    <>
      <SubNav items={subNavItems} />
      <RoomCalendarView />
    </>
  );
}
