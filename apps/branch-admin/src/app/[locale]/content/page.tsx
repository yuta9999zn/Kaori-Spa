import { setRequestLocale } from 'next-intl/server';
import ContentList from './ContentList';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';

export default async function ContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const items = await getSubNavItems('content');
  return (
    <>
      <SubNav items={items} />
      <ContentList />
    </>
  );
}
