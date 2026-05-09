import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';

export default async function StaffPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // /staff is a virtual section — the real default landing is the overview tab.
  redirect({ href: '/staff/overview', locale });
}
