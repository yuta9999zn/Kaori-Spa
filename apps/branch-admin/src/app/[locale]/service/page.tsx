import { setRequestLocale } from 'next-intl/server';
import ServiceView from './ServiceView';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function ServicePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('service');
  return (
    <>
      <SubNav items={items} />
      <ServiceView />
    </>
  );
}
