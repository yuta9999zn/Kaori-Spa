import { setRequestLocale } from 'next-intl/server';
import PayrollTable from './PayrollTable';

export default async function PayrollPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PayrollTable />;
}
