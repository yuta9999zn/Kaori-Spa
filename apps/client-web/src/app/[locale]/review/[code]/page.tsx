import { setRequestLocale } from 'next-intl/server';
import ReviewForm from './ReviewForm';

export default async function ReviewPage({
  params
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  return (
    <section className="container-prose py-12">
      <ReviewForm code={code} locale={locale} />
    </section>
  );
}
