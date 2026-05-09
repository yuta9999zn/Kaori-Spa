import { setRequestLocale } from 'next-intl/server';
import InventoryView from './InventoryView';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function InventoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('inventory');
  return (
    <>
      <SubNav items={items} />
      <InventoryView />
    </>
  );
}
