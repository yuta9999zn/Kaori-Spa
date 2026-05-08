import { setRequestLocale } from 'next-intl/server';
import VoucherManager from './VoucherManager';

export default async function VoucherPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VoucherManager />;
}
