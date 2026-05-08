'use client';

import { useEffect, useState } from 'react';
import {
  Megaphone, Plus, Loader2, Mail, MessageSquare, Bell, Smartphone,
  XCircle, Clock, AlertCircle, CheckCircle2, Send
} from 'lucide-react';
import { api, ApiError, ctx } from '@/lib/api';
import { cn } from '@/lib/cn';

interface CampaignDto {
  id: string;
  name: string;
  channel: 'sms' | 'email' | 'inapp' | 'push';
  templateCode: string;
  status: 'draft' | 'scheduled' | 'running' | 'done' | 'cancelled' | 'failed';
  scheduledAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

const SEED: CampaignDto[] = [
  { id: 's1', name: 'Khuyến mãi Tết 2026', channel: 'sms', templateCode: 'campaign.tet2026',
    status: 'done', scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    totalRecipients: 842, sentCount: 820, failedCount: 22, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 's2', name: 'VIP nhắc tháng 5', channel: 'email', templateCode: 'campaign.vip-may',
    status: 'scheduled', scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    totalRecipients: 0, sentCount: 0, failedCount: 0, createdAt: new Date().toISOString() },
  { id: 's3', name: 'Mời quay lại sau 90 ngày', channel: 'sms', templateCode: 'campaign.dormant',
    status: 'running', scheduledAt: new Date(Date.now() - 600000).toISOString(),
    totalRecipients: 156, sentCount: 78, failedCount: 3, createdAt: new Date().toISOString() }
];

const CHANNEL_ICON = { sms: MessageSquare, email: Mail, inapp: Bell, push: Smartphone };

const STATUS_BG: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  scheduled: 'bg-amber-100 text-amber-700',
  running:   'bg-blue-100 text-blue-700',
  done:      'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  failed:    'bg-rose-100 text-rose-700'
};

export default function CampaignManager() {
  const [list, setList] = useState<CampaignDto[]>(SEED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await api<CampaignDto[]>(`/v1/campaigns?tenantId=${ctx.tenantId}`);
      setList(r);
      setError(null);
    } catch (e) { setError((e as ApiError).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, []);

  const cancel = async (id: string) => {
    if (!confirm('Huỷ chiến dịch này?')) return;
    try { await api(`/v1/campaigns/${id}/cancel`, { method: 'POST' }); await refresh(); }
    catch (e) { alert((e as ApiError).message); }
  };

  const totals = list.reduce((a, c) => ({
    sent: a.sent + c.sentCount,
    recipients: a.recipients + c.totalRecipients,
    failed: a.failed + c.failedCount
  }), { sent: 0, recipients: 0, failed: 0 });
  const deliveryRate = totals.recipients > 0
    ? Math.round((totals.sent / totals.recipients) * 100)
    : 0;

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-brand-textmain flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-brand-gold" />
            Marketing Campaigns
          </h1>
          <p className="text-sm text-brand-textmuted">Gửi SMS / Email hàng loạt theo phân khúc khách hàng</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus className="h-4 w-4" /> Tạo chiến dịch
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          API offline — demo data.
        </div>
      )}

      {/* KPIs */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <Stat Icon={Send}        label="Đã gửi" value={totals.sent.toLocaleString('vi-VN')} />
        <Stat Icon={CheckCircle2} label="Tỉ lệ giao" value={`${deliveryRate}%`} />
        <Stat Icon={XCircle}     label="Thất bại" value={String(totals.failed)} tone="rose" />
        <Stat Icon={Megaphone}   label="Chiến dịch" value={String(list.length)} />
      </section>

      {showForm && <CreateForm onCreated={() => { setShowForm(false); refresh(); }} />}

      {loading ? (
        <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-textmuted" /></div>
      ) : (
        <ul className="space-y-3">
          {list.map(c => {
            const Icon = CHANNEL_ICON[c.channel];
            const progress = c.totalRecipients > 0
              ? Math.round((c.sentCount / c.totalRecipients) * 100) : 0;
            return (
              <li key={c.id} className="card-soft">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <h3 className="font-medium truncate">{c.name}</h3>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest', STATUS_BG[c.status])}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-textmuted font-mono">{c.templateCode}</p>
                    {c.scheduledAt && (
                      <p className="text-xs text-brand-textmuted mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(c.scheduledAt).toLocaleString('vi-VN')}
                      </p>
                    )}
                    {c.totalRecipients > 0 && (
                      <div className="mt-2">
                        <div className="flex items-baseline justify-between text-[11px] text-brand-textmuted mb-1">
                          <span>{c.sentCount}/{c.totalRecipients} đã gửi</span>
                          {c.failedCount > 0 && <span className="text-rose-600">{c.failedCount} fail</span>}
                        </div>
                        <div className="h-1.5 rounded-full bg-brand-cream overflow-hidden">
                          <div className="h-full bg-brand-gold transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {(c.status === 'scheduled' || c.status === 'running') && (
                    <button onClick={() => cancel(c.id)} className="text-brand-textmuted hover:text-rose-600 p-1.5" aria-label="Cancel">
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const [templateCode, setTemplateCode] = useState('booking.created');
  const [segment, setSegment] = useState<'all' | 'vip' | 'regular' | 'new' | 'dormant'>('all');
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api('/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: ctx.tenantId,
          name, channel, templateCode,
          segmentFilter: segment === 'all' ? {} : { segment },
          scheduledAt: new Date(scheduledAt).toISOString()
        })
      });
      onCreated();
    } catch (e) { setError((e as ApiError).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card-soft mb-6 space-y-3">
      <h3 className="font-serif text-base">Tạo chiến dịch</h3>
      <Field label="Tên *">
        <input value={name} onChange={e => setName(e.target.value)} className="fi" placeholder="Vd: Khuyến mãi 8/3" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kênh *">
          <select value={channel} onChange={e => setChannel(e.target.value as 'sms')} className="fi">
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </Field>
        <Field label="Template code *">
          <input value={templateCode} onChange={e => setTemplateCode(e.target.value)}
            className="fi font-mono" placeholder="booking.created" />
        </Field>
        <Field label="Phân khúc">
          <select value={segment} onChange={e => setSegment(e.target.value as 'all')} className="fi">
            <option value="all">Tất cả khách (đã đồng ý nhận tin)</option>
            <option value="vip">VIP</option>
            <option value="regular">Thường xuyên</option>
            <option value="new">Khách mới</option>
            <option value="dormant">Lâu chưa quay lại</option>
          </select>
        </Field>
        <Field label="Hẹn giờ gửi *">
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="fi" />
        </Field>
      </div>

      {error && (
        <p className="flex items-center gap-1 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={submit} disabled={busy || !name || !templateCode}
          className="btn-primary disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Lên lịch gửi
        </button>
      </div>
      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 8px 12px;
              font-size: 14px; background: #faf9f6; outline: none; transition: border 0.2s; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
      `}</style>
    </div>
  );
}

function Stat({ Icon, label, value, tone }: { Icon: typeof Send; label: string; value: string; tone?: 'rose' }) {
  return (
    <article className="kpi-card !p-3 sm:!p-4">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg mb-2',
        tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-brand-gold/10 text-brand-gold')}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-serif text-xl sm:text-2xl text-brand-textmain leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mt-1">{label}</p>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1">{label}</span>
      {children}
    </label>
  );
}
