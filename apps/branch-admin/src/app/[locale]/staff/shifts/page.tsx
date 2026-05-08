import { setRequestLocale } from 'next-intl/server';
import ShiftManager from './ShiftManager';

export default async function ShiftsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ShiftManager />;
}
