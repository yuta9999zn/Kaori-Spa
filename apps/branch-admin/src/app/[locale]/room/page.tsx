import { setRequestLocale } from 'next-intl/server';
import RoomView from './RoomView';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function RoomPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('room');
  return (
    <>
      <SubNav items={items} />
      <RoomView />
    </>
  );
}
