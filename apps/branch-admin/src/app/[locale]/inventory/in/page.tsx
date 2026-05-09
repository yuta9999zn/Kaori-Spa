import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import InventoryInView from './InventoryInView';

export default async function InventoryInPage({
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
      <InventoryInView />
    </>
  );
}
