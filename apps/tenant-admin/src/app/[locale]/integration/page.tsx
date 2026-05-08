import { setRequestLocale } from 'next-intl/server';
import IntegrationView from './IntegrationView';

export default async function IntegrationPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <IntegrationView />;
}
