// TODO(M3+): wizard partially calls /v1/orgs (which works) but also branch / staff
//            bootstrap endpoints that aren't defined yet — leave wiring to wizard owner.
import { setRequestLocale } from 'next-intl/server';
import OnboardingWizard from './OnboardingWizard';

export default async function OnboardingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OnboardingWizard />;
}
