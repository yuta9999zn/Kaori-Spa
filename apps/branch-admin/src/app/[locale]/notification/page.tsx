import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Bell, Settings, Calendar, Users, Boxes, Server, Check } from 'lucide-react';

type Category = 'booking' | 'staff' | 'inventory' | 'system';

// TODO(Phase B): wire to backend - replace with /v1/notifications endpoint.
const NOTIFICATIONS: { id: string; category: Category; title: string; body: string; at: string; unread: boolean }[] = [
  { id: 'n-1', category: 'booking',   title: 'Booking mới #BK-2412', body: 'Khách Trần Mỹ Duyên đặt Massage Thuỵ Điển 60p lúc 16:00', at: '2 phút trước', unread: true },
  { id: 'n-2', category: 'booking',   title: 'Khách check-in', body: 'Phạm Anh Thư đã đến quầy lễ tân', at: '8 phút trước', unread: true },
  { id: 'n-3', category: 'inventory', title: 'Mặt nạ collagen sắp hết', body: 'Tồn kho 6 gói. Nhà cung cấp Beauty Pro JSC', at: '32 phút trước', unread: true },
  { id: 'n-4', category: 'staff',     title: 'Yêu cầu nghỉ phép', body: 'Đức Thanh xin nghỉ ngày 12/05', at: '1 giờ trước', unread: false },
  { id: 'n-5', category: 'system',    title: 'Cập nhật phần mềm', body: 'Phiên bản 1.4.2 đã có. Khởi động lại để áp dụng.', at: '4 giờ trước', unread: false },
  { id: 'n-6', category: 'booking',   title: 'Khách huỷ #BK-2398', body: 'Lê Quỳnh Như huỷ booking 14:00', at: '6 giờ trước', unread: false }
];

const ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  booking: Calendar,
  staff: Users,
  inventory: Boxes,
  system: Server
};

export default async function NotificationPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('notification');

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-brand-textmain flex items-center gap-3">
            <Bell className="h-7 w-7 text-brand-gold" /> {t('title')}
          </h1>
          <p className="text-sm text-brand-gold mt-1">{t('unreadCount', { count: unreadCount })}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost"><Check className="h-4 w-4" /> {t('markAllRead')}</button>
          <button className="btn-ghost"><Settings className="h-4 w-4" /> {t('settings')}</button>
        </div>
      </header>

      <section className="kpi-card mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['all', 'booking', 'staff', 'inventory', 'system'] as const).map(f => (
              <button key={f} className={`rounded-full border px-3 py-1.5 text-xs ${f === 'all' ? 'border-brand-gold bg-brand-gold/10 text-brand-goldhover' : 'border-brand-cream bg-white text-brand-textmuted'}`}>
                {t(`filters.${f}` as 'filters.all')}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" /> <span>{t('onlyUnread')}</span>
          </label>
        </div>
      </section>

      <section className="kpi-card">
        {NOTIFICATIONS.length === 0 ? (
          <p className="text-center text-sm text-brand-textmuted py-8">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-brand-cream/60">
            {NOTIFICATIONS.map(n => {
              const Icon = ICONS[n.category];
              return (
                <li key={n.id} className={`flex items-start gap-4 py-3 ${n.unread ? 'bg-brand-gold/5 -mx-3 px-3 rounded-lg' : ''}`}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-brand-gold/10 text-brand-gold shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-brand-textmain">
                        {n.title}
                        {n.unread && <span className="inline-block ml-2 h-1.5 w-1.5 rounded-full bg-brand-gold align-middle" />}
                      </p>
                      <span className="text-[11px] text-brand-textmuted shrink-0">{n.at}</span>
                    </div>
                    <p className="text-xs text-brand-textmuted mt-1">{n.body}</p>
                  </div>
                  {n.unread && (
                    <button className="text-[11px] text-brand-gold hover:underline shrink-0">{t('markRead')}</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
