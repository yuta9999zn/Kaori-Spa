'use client';

import dynamic from 'next/dynamic';
import Skeleton from './Skeleton';

/**
 * Client wrapper around the recharts components so they can be loaded
 * with `dynamic({ ssr: false })`. Recharts is ~80KB gzipped — keeping it
 * out of the initial bundle saves first paint on slow 3G/4G connections.
 *
 * The skeleton plays the role of layout placeholder so the page doesn't
 * jump when charts hydrate.
 */
const RevenueChart = dynamic(() => import('./charts/RevenueChart'), {
  loading: () => <Skeleton.Chart />,
  ssr: false
});

const ServiceDonut = dynamic(() => import('./charts/ServiceDonut'), {
  loading: () => <Skeleton.Chart />,
  ssr: false
});

export default function DashboardCharts() {
  return (
    <section className="grid gap-6 lg:grid-cols-3 mb-6">
      <article className="lg:col-span-2 kpi-card">
        <h2 className="font-serif text-lg text-brand-textmain mb-4">Doanh thu 14 ngày</h2>
        <RevenueChart />
      </article>
      <article className="kpi-card">
        <h2 className="font-serif text-lg text-brand-textmain mb-4">Dịch vụ nổi bật</h2>
        <ServiceDonut />
      </article>
    </section>
  );
}
