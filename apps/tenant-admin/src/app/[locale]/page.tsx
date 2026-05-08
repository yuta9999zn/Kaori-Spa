import { setRequestLocale, getTranslations } from 'next-intl/server';
import DashboardView from './DashboardView';

export default async function TenantDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');

  const labels = {
    title: t('title'),
    recentTenants: t('recentTenants'),
    kpi: {
      tenants: t('kpi.tenants'),
      branches: t('kpi.branches'),
      users: t('kpi.users'),
      mrr: t('kpi.mrr')
    }
  };

  return <DashboardView labels={labels} />;
}
