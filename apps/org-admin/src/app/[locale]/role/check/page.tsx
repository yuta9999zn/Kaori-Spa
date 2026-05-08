import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ShieldAlert, Sliders, Shield, UserCheck, AlertCircle, CheckCircle2, XCircle, Play } from 'lucide-react';

// TODO(backend): permission-simulation endpoint (POST /v1/permissions/check)
// + audit-log read endpoint not yet shipped. Page is fully mocked.

export default async function PermissionCheckPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('permissionCheck');

  const events = [
    { time: '2026-05-08 16:45:12', actor: 'Nguyễn Thị Mai',  event: 'permission.escalation', target: 'ORG_OWNER · Toàn tổ chức',    description: 'Cấp full quyền xoá module Customers',                    ip: '192.168.1.1',  severity: 'rose' },
    { time: '2026-05-08 10:22:05', actor: 'Trần Quốc Hùng',  event: 'permission.update',     target: 'BRANCH_MANAGER · BR-HCM-01',  description: 'Bật quyền booking:cancel cho Branch Manager',           ip: '10.0.0.55',    severity: 'blue' },
    { time: '2026-05-07 09:15:33', actor: 'Nguyễn Thị Mai',  event: 'role.assign',           target: 'RECEPTIONIST · BR-HCM-02',    description: 'Gán vai trò cho Lê Thanh Hà',                            ip: '192.168.1.1',  severity: 'gold' },
    { time: '2026-05-06 14:00:11', actor: 'Kaori Admin',     event: 'role.create',           target: 'JR_THERAPIST · Toàn tổ chức', description: 'Tạo vai trò tuỳ biến cho học viên',                       ip: '10.0.0.10',    severity: 'green' },
    { time: '2026-05-05 17:30:00', actor: 'Trần Quốc Hùng',  event: 'role.revoke',           target: 'THERAPIST · BR-HCM-01',       description: 'Thu hồi vai trò khỏi nhân viên',                          ip: '192.168.1.1',  severity: 'gray'  }
  ];

  // Mocked simulation result
  const result = { allowed: true, action: 'booking:cancel', user: 'Trần Quốc Hùng', branch: 'BR-HCM-01', reason: 'BRANCH_MANAGER có booking:cancel ở scope branch' };

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-brand-gold" />
            {t('title')}
          </h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-2xl">{t('subtitle')}</p>
        </div>
      </header>

      {/* KPI summary */}
      <section className="grid gap-4 grid-cols-2 xl:grid-cols-4 mb-6">
        <KpiCard label={t('kpi.changesToday')}  value="12" Icon={Sliders}     accent="text-brand-gold" bg="bg-brand-gold/10" />
        <KpiCard label={t('kpi.rolesModified')} value="3"  Icon={Shield}      accent="text-blue-600"   bg="bg-blue-50" />
        <KpiCard label={t('kpi.assignments')}   value="8"  Icon={UserCheck}   accent="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard label={t('kpi.alerts')}        value="1"  Icon={AlertCircle} accent="text-brand-rose" bg="bg-brand-rose/10" />
      </section>

      {/* Simulator + result */}
      <section className="grid gap-6 lg:grid-cols-3 mb-8">
        <article className="kpi-card lg:col-span-2">
          <h2 className="font-serif text-lg text-brand-textmain mb-4">{t('simulate')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('form.user')}>
              <select className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                <option>Trần Quốc Hùng (BRANCH_MANAGER)</option>
                <option>Lê Thanh Hà (RECEPTIONIST)</option>
                <option>Phạm Yến Nhi (THERAPIST)</option>
              </select>
            </Field>
            <Field label={t('form.branch')}>
              <select className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-gold">
                <option>BR-HCM-01 · Quận 1</option>
                <option>BR-HCM-02 · Quận 7</option>
                <option>BR-HN-01 · Hà Nội</option>
              </select>
            </Field>
            <Field label={t('form.action')}>
              <input
                className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm font-mono outline-none focus:border-brand-gold"
                defaultValue="booking:cancel"
              />
            </Field>
            <div className="flex items-end">
              <button className="btn-primary w-full justify-center">
                <Play className="h-4 w-4" /> {t('form.submit')}
              </button>
            </div>
          </div>
        </article>

        <article className="kpi-card">
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{t('form.action')}</p>
          <p className="mt-1 font-mono text-sm text-brand-textmain">{result.action}</p>
          <div className="my-3 h-px bg-brand-cream" />
          {result.allowed ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{t('result.allowed')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">{t('result.denied')}</span>
            </div>
          )}
          <p className="mt-3 text-[10px] uppercase tracking-widest text-brand-textmuted">{t('result.trace')}</p>
          <p className="mt-1 text-xs text-brand-textmain">{result.reason}</p>
        </article>
      </section>

      {/* Audit log table */}
      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              {(['time', 'actor', 'event', 'target', 'description', 'ip'] as const).map(c => (
                <th key={c} className="text-left px-4 py-3 font-medium">
                  {t(`columns.${c}` as 'columns.time')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {events.map(e => (
              <tr key={e.time} className={`hover:bg-brand-cream/20 ${e.severity === 'rose' ? 'bg-brand-rose/5' : ''}`}>
                <td className="px-4 py-3 font-mono text-[11px] text-brand-textmuted">{e.time}</td>
                <td className="px-4 py-3 text-brand-textmain">{e.actor}</td>
                <td className="px-4 py-3">
                  <EventBadge severity={e.severity} code={e.event} />
                </td>
                <td className="px-4 py-3 text-brand-textmuted">{e.target}</td>
                <td className="px-4 py-3 text-brand-textmain">{e.description}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-brand-textmuted">{e.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-2">{label}</label>
      {children}
    </div>
  );
}

function KpiCard({
  label, value, Icon, accent, bg
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
}) {
  return (
    <article className="kpi-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-brand-textmuted">{label}</p>
          <p className={`mt-1 font-serif text-3xl ${accent}`}>{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
    </article>
  );
}

function EventBadge({ severity, code }: { severity: string; code: string }) {
  const map: Record<string, string> = {
    rose:  'bg-brand-rose/20 text-brand-rose border-brand-rose/30',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
    gold:  'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray:  'bg-slate-50 text-slate-600 border-slate-200'
  };
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${map[severity] ?? ''}`}>
      {code}
    </span>
  );
}
