import { setRequestLocale } from 'next-intl/server';
import ServiceList from './ServiceList';

export default async function ServicePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServiceList />;
}
