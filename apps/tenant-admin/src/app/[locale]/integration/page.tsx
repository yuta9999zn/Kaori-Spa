// TODO(M3+): WebhookManager calls /v1/webhooks directly, but no integration-service
//            endpoint exists yet — kept as-is so it's a no-op when API is offline.
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
