import { setRequestLocale } from 'next-intl/server';
import OnboardingView from './OnboardingView';

export default async function OnboardingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OnboardingView />;
}
