import { setRequestLocale } from 'next-intl/server';
import ContentList from './ContentList';

// CMS list backed by content-service. See ContentList.tsx for the client view.
export default async function ContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentList />;
}
