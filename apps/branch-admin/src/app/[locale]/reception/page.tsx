import { setRequestLocale } from 'next-intl/server';
import ReceptionView from './ReceptionView';

export default async function ReceptionPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReceptionView />;
}
