import { setRequestLocale } from 'next-intl/server';
import LeaderboardView from './LeaderboardView';

export default async function LeaderboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LeaderboardView />;
}
