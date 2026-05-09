import { setRequestLocale } from 'next-intl/server';
import NotificationView from './NotificationView';

/**
 * Thin server shell. The actual UI is the NotificationView client component
 * which talks to notification-service via the inbox hooks. Keeping this
 * file as a server component means the locale gets registered with
 * next-intl before any translation lookup happens client-side.
 */
export default async function NotificationPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NotificationView />;
}
