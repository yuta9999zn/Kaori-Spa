import { setRequestLocale } from 'next-intl/server';
import DomainConfigView from './DomainConfigView';

export default async function DomainPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DomainConfigView />;
}
