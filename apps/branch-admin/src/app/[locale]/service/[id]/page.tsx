import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import ServiceDetailView from './ServiceDetailView';

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('service');
  return (
    <>
      <SubNav items={subNavItems} />
      <ServiceDetailView id={id} />
    </>
  );
}
