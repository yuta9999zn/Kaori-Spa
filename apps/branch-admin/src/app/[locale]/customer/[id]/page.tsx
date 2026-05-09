import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import CustomerDetail from './CustomerDetail';

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  return (
    <>
      <SubNav items={subNavItems} />
      <CustomerDetail id={id} />
    </>
  );
}
