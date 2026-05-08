import { setRequestLocale } from 'next-intl/server';
import FeatureToggleView from './FeatureToggleView';

export default async function FeaturePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FeatureToggleView />;
}
