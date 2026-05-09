import { setRequestLocale } from 'next-intl/server';
import CustomerList from './CustomerList';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('customer');
  return (
    <>
      <SubNav items={items} />
      <CustomerList />
    </>
  );
}
