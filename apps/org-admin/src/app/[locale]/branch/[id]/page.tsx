import { setRequestLocale } from 'next-intl/server';
import BranchDetailView from './BranchDetailView';

export default async function BranchDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <BranchDetailView branchId={id} />;
}
