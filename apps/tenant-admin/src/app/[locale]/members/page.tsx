import { setRequestLocale } from 'next-intl/server';
import MembersView from './MembersView';

export default async function MembersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MembersView />;
}
