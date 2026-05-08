import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';

const ROLES = ['ORG_OWNER', 'BRANCH_MANAGER', 'RECEPTIONIST', 'THERAPIST', 'ACCOUNTANT'];
const PERMS = [
  { code: 'branch:create',     allow: [true, false, false, false, false] },
  { code: 'staff:create',      allow: [true, true,  false, false, false] },
  { code: 'staff:salary:read', allow: [true, true,  false, false, true ] },
  { code: 'customer:read',     allow: [true, true,  true,  true,  false] },
  { code: 'customer:write',    allow: [true, true,  true,  false, false] },
  { code: 'booking:create',    allow: [true, true,  true,  false, false] },
  { code: 'booking:cancel',    allow: [true, true,  true,  false, false] },
  { code: 'payment:create',    allow: [true, true,  true,  false, false] },
  { code: 'report:branch',     allow: [true, true,  false, false, true ] },
  { code: 'report:org',        allow: [true, false, false, false, true ] },
  { code: 'audit:read',        allow: [true, false, false, false, false] }
];

export default async function RolePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('role');

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl">{t('title')}</h1>
        <p className="text-sm text-brand-textmuted">{t('subtitle')}</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-brand-cream bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream/40 text-[10px] uppercase tracking-widest text-brand-textmuted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Permission</th>
              {ROLES.map(r => <th key={r} className="text-center px-3 py-3 font-medium">{r}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {PERMS.map(p => (
              <tr key={p.code}>
                <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                {p.allow.map((on, i) => (
                  <td key={i} className="px-3 py-3 text-center">
                    {on ? <Check className="inline h-4 w-4 text-emerald-600" /> : <span className="text-brand-textmuted">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
