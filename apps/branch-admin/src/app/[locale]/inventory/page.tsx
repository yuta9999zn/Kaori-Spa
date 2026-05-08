import { setRequestLocale } from 'next-intl/server';
import InventoryView from './InventoryView';

export default async function InventoryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InventoryView />;
}
