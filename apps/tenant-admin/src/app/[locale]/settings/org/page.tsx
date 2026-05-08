import { setRequestLocale } from 'next-intl/server';
import OrgSettingsView from './OrgSettingsView';

export default async function OrgSettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OrgSettingsView />;
}
