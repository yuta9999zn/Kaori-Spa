import { setRequestLocale } from 'next-intl/server';
import { SubNav } from '@/components/SubNav';
import { getSubNavItems } from '@/components/subNavItems';
import StaffOverviewView from './StaffOverviewView';

export default async function StaffOverviewPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const subNavItems = await getSubNavItems('staff');
  return (
    <>
      <SubNav items={subNavItems} />
      <StaffOverviewView />
    </>
  );
}
