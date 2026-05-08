import { setRequestLocale } from 'next-intl/server';
import BranchList from './BranchList';

export default async function BranchListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BranchList />;
}
