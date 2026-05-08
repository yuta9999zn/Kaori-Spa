import { setRequestLocale } from 'next-intl/server';
import CustomerList from './CustomerList';

export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CustomerList />;
}
