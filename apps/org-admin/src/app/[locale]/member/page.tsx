import { setRequestLocale } from 'next-intl/server';
import MemberList from './MemberList';

export default async function MemberPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MemberList />;
}
