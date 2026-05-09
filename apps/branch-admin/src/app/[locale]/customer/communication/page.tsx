import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Send, Megaphone, Mail, MessageSquare, Phone } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'zalo';
  audience: string;
  status: 'active' | 'scheduled' | 'completed';
  sent: number;
  openRate: string;
};

export default async function CustomerCommunicationPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('customerCommunication');

  // TODO(Phase B): wire to backend when endpoint ships
  const campaigns: Campaign[] = [
    { id: 'CMP-001', name: 'Spring Detox Promotion', channel: 'email', audience: t('audience.allCustomers'), status: 'active', sent: 1240, openRate: '42.4%' },
    { id: 'CMP-002', name: 'VIP Exclusive Preview', channel: 'sms', audience: t('audience.vip'), status: 'scheduled', sent: 0, openRate: '-' },
    { id: 'CMP-003', name: "Valentine's Day Special", channel: 'email', audience: t('audience.regulars'), status: 'completed', sent: 980, openRate: '38.2%' }
  ];

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain">{t('title')}</h1>
          <p className="text-sm text-brand-textmuted mt-1 max-w-xl">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost"><Send className="h-4 w-4" /> {t('sendMessage')}</button>
          <button className="btn-primary"><Megaphone className="h-4 w-4" /> {t('createCampaign')}</button>
        </div>
      </header>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
        <KpiTile label={t('kpi.sentToday')} value="320" />
        <KpiTile label={t('kpi.activeCampaigns')} value="3" />
        <KpiTile label={t('kpi.deliveryRate')} value="98.7%" accent="green" />
        <KpiTile label={t('kpi.openRate')} value="42.4%" accent="gold" />
        <KpiTile label={t('kpi.responseRate')} value="12.8%" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-cream bg-white shadow-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-cream/60 bg-brand-ivory/30">
            <h2 className="font-serif text-lg text-brand-textmain">{t('campaigns')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-brand-ivory/20 text-[10px] uppercase tracking-widest text-brand-textmuted border-b border-brand-cream">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.campaign')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.channel')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.audience')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.sent')}</th>
                  <th className="text-center px-4 py-3 font-medium">{t('cols.openRate')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('cols.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream/60">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-brand-ivory/30">
                    <td className="px-4 py-3">
                      <p className="font-serif text-brand-textmain">{c.name}</p>
                      <p className="text-[10px] font-mono text-brand-textmuted">{c.id}</p>
                    </td>
                    <td className="px-4 py-3"><ChannelBadge ch={c.channel} label={t(`channel.${c.channel}`)} /></td>
                    <td className="px-4 py-3 text-brand-textmuted">{c.audience}</td>
                    <td className="px-4 py-3 text-center font-mono">{c.sent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center font-mono">{c.openRate}</td>
                    <td className="px-4 py-3"><StatusBadge s={c.status} label={t(`status.${c.status}`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-cream bg-white p-5 shadow-soft">
            <h3 className="font-serif text-lg text-brand-textmain flex items-center mb-3"><Send className="h-4 w-4 mr-2 text-brand-gold" /> {t('quickSend')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">{t('searchCustomer')}</label>
                <input type="text" placeholder={t('searchPlaceholder')} className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">{t('channel.label')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <ChannelChoice label="Email" icon={<Mail className="h-4 w-4" />} />
                  <ChannelChoice label="SMS" icon={<MessageSquare className="h-4 w-4" />} />
                  <ChannelChoice label="Zalo" icon={<Phone className="h-4 w-4" />} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-semibold text-brand-textmuted mb-1.5">{t('messageContent')}</label>
                <textarea rows={3} className="w-full rounded-xl border border-brand-cream bg-white px-3 py-2 text-sm resize-none" placeholder={t('messagePlaceholder')} />
              </div>
              <button className="btn-primary w-full justify-center">{t('send')}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: 'gold' | 'green' }) {
  const labelCls = accent === 'gold' ? 'text-brand-gold' : accent === 'green' ? 'text-green-600' : 'text-brand-textmuted';
  return (
    <div className="kpi-card">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${labelCls}`}>{label}</p>
      <p className="font-serif text-2xl text-brand-textmain">{value}</p>
    </div>
  );
}

function ChannelBadge({ ch, label }: { ch: Campaign['channel']; label: string }) {
  const Icon = ch === 'email' ? Mail : ch === 'sms' ? MessageSquare : Phone;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-brand-ivory text-brand-textmain border-brand-cream">
      <Icon className="h-3 w-3 mr-1" />{label}
    </span>
  );
}

function StatusBadge({ s, label }: { s: Campaign['status']; label: string }) {
  const cls =
    s === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
    s === 'scheduled' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>{label}</span>;
}

function ChannelChoice({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button className="rounded-xl border border-brand-cream bg-white px-2 py-2 text-xs font-medium text-brand-textmain hover:border-brand-gold flex items-center justify-center gap-1.5">
      {icon}{label}
    </button>
  );
}
