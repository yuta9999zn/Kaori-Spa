import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import CustomerLoyaltyView from './CustomerLoyaltyView';

export default async function CustomerLoyaltyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('customer');
  return (
    <>
      <SubNav items={subNavItems} />
      <CustomerLoyaltyView />
    </>
  );
}
