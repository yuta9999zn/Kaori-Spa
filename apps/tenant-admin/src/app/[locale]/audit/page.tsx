import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('audit');

  const rows = [
    { ts: '2026-05-06 09:24:11', actor: 'miko@nb.vn',    action: 'booking.create',  entity: 'booking:BK-001',           ip: '113.176.x.x' },
    { ts: '2026-05-06 09:18:02', actor: 'huong@nb.vn',   action: 'staff.update',    entity: 'staff:KTV-Mai',            ip: '113.176.x.x' },
    { ts: '2026-05-06 08:55:49', actor: 'miko@nb.vn',    action: 'login',           entity: 'session:abc12',            ip: '113.176.x.x' },
    { ts: '2026-05-06 08:01:00', actor: 'system',        action: 'kafka.consume',   entity: 'topic:kaori.booking.v1',   ip: '-' },
    { ts: '2026-05-05 17:42:15', actor: 'admin@kaori.io',action: 'tenant.plan.set', entity: 'tenant:natural-beauty',    ip: '203.113.x.x' }
  ];

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>{(['ts', 'actor', 'action', 'entity', 'ip'] as const).map(c =>
              <th key={c} className="text-left px-4 py-3 font-medium">{t(`columns.${c}` as 'columns.ts')}</th>
            )}</tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-brand-cream/20">
                <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{r.ts}</td>
                <td className="px-4 py-3">{r.actor}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-gold">{r.action}</td>
                <td className="px-4 py-3 text-brand-textmuted">{r.entity}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-textmuted">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
