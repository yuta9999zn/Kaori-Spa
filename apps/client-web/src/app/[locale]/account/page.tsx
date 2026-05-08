import { setRequestLocale } from 'next-intl/server';
import AccountPanel from './AccountPanel';

export default async function AccountPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <section className="container-prose py-12">
      <AccountPanel locale={locale} />
    </section>
  );
}
