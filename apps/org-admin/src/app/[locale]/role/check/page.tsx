import { setRequestLocale } from 'next-intl/server';
import PermissionCheckView from './PermissionCheckView';

export default async function PermissionCheckPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PermissionCheckView />;
}
