import { setRequestLocale } from 'next-intl/server';
import BrandingView from './BrandingView';

export default async function BrandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BrandingView />;
}
