import { setRequestLocale } from 'next-intl/server';
import RoleList from './RoleList';

export default async function RolePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RoleList />;
}
