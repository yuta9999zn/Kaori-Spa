import { setRequestLocale } from 'next-intl/server';
import WebhookManager from './WebhookManager';

export default async function IntegrationPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WebhookManager />;
}
