import { setRequestLocale } from 'next-intl/server';
import RoleAssignView from './RoleAssignView';

export default async function RoleAssignPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RoleAssignView />;
}
