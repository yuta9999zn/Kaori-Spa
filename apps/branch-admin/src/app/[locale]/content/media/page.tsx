import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import ContentMediaView from './ContentMediaView';

export default async function ContentMediaPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('content');
  return (
    <>
      <SubNav items={subNavItems} />
      <ContentMediaView />
    </>
  );
}
