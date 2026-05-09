import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import ServiceListView from './ServiceListView';

export default async function ServiceListPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  return (
    <>
      <SubNav items={subNavItems} />
      <ServiceListView />
    </>
  );
}
