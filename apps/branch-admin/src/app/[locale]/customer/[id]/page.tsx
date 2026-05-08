import { setRequestLocale } from 'next-intl/server';
import CustomerDetail from './CustomerDetail';

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <CustomerDetail id={id} />;
}
