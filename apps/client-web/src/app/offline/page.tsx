import { WifiOff, RefreshCw } from 'lucide-react';

export const metadata = {
  title: 'Offline · Natural Beauty',
  robots: { index: false, follow: false }
};

/**
 * Served by the service worker when the user navigates to a non-cached
 * route while offline. Static — no client JS, no API calls.
 */
export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream text-brand-textmuted">
        <WifiOff className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h1 className="font-serif text-3xl text-brand-textmain mb-3">Bạn đang offline</h1>
      <p className="max-w-sm text-brand-textmuted mb-8 leading-relaxed">
        Vui lòng kiểm tra kết nối mạng và thử lại. Một số trang đã xem trước đó vẫn có thể truy cập.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-6 py-3 text-sm font-medium text-white"
      >
        <RefreshCw className="h-4 w-4" />
        Thử lại
      </a>
    </main>
  );
}
