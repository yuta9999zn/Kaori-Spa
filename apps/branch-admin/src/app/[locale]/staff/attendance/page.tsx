import { setRequestLocale } from 'next-intl/server';
import AttendanceTable from './AttendanceTable';

export default async function AttendancePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AttendanceTable />;
}
