import { setRequestLocale } from 'next-intl/server';
import ContentList from './ContentList';

export default async function ContentPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentList />;
}
