import { setRequestLocale } from 'next-intl/server';
import CampaignManager from './CampaignManager';

export default async function CampaignsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CampaignManager />;
}
