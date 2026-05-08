import { setRequestLocale } from 'next-intl/server';
import PermissionMatrixView from './PermissionMatrixView';

export default async function PermissionMatrixPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PermissionMatrixView />;
}
