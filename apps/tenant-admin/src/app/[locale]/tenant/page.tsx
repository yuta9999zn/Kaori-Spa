import { setRequestLocale, getTranslations } from 'next-intl/server';
import TenantList from './TenantList';

export default async function TenantListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('tenant');

  // Pass i18n strings down so the client component stays UI-only.
  const labels = {
    title: t('title'),
    create: t('create'),
    columns: {
      code: t('columns.code'),
      name: t('columns.name'),
      plan: t('columns.plan'),
      branches: t('columns.branches'),
      status: t('columns.status'),
      createdAt: t('columns.createdAt')
    }
  };

  return <TenantList labels={labels} />;
}
