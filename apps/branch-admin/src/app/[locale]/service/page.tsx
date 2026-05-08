import { setRequestLocale } from 'next-intl/server';
import ServiceView from './ServiceView';

export default async function ServicePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServiceView />;
}
