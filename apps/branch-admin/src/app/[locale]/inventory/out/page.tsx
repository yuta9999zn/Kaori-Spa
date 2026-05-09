import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import InventoryOutView from './InventoryOutView';

export default async function InventoryOutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('inventory');
  return (
    <>
      <SubNav items={subNavItems} />
      <InventoryOutView />
    </>
  );
}
