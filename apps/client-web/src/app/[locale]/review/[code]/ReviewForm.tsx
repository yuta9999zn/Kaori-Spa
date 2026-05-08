'use client';

import { useState } from 'react';
import { Star, Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/cn';

const PROMPTS: Record<string, { title: string; body: string; phone: string; submit: string; thanks: string; back: string; comment: string; }> = {
  vi: {
    title: 'Đánh giá trải nghiệm',
    body: 'Cảm ơn bạn đã sử dụng dịch vụ tại Natural Beauty. Chia sẻ trải nghiệm để chúng tôi phục vụ tốt hơn.',
    phone: 'SĐT đặt lịch',
    submit: 'Gửi đánh giá',
    thanks: 'Cảm ơn bạn!',
    back: 'Về trang chủ',
    comment: 'Nhận xét (không bắt buộc)'
  },
  en: { title: 'Rate your visit', body: 'Thanks for visiting Natural Beauty. Tell us how we did.', phone: 'Phone used to book', submit: 'Submit', thanks: 'Thank you!', back: 'Home', comment: 'Comment (optional)' },
  ja: { title: 'ご感想をお聞かせください', body: 'Natural Beauty をご利用いただきありがとうございます。', phone: '予約時の電話番号', submit: '送信', thanks: 'ありがとうございました!', back: 'ホームへ', comment: 'コメント (任意)' },
  zh: { title: '请评价您的体验', body: '感谢光临 Natural Beauty,请分享您的感受。', phone: '预约电话', submit: '提交', thanks: '感谢您!', back: '首页', comment: '评论(可选)' },
  ko: { title: '리뷰를 남겨주세요', body: 'Natural Beauty 이용 감사합니다.', phone: '예약 시 전화번호', submit: '제출', thanks: '감사합니다!', back: '홈', comment: '코멘트 (선택)' }
};

export default function ReviewForm({ code, locale }: { code: string; locale: string }) {
  const t = PROMPTS[locale] ?? PROMPTS.vi;
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (rating < 1 || !phone) return;
    setBusy(true); setError(null);
    try {
      await api('/v1/public/reviews', {
        method: 'POST',
        body: JSON.stringify({ code, phone, rating, comment: comment || undefined })
      });
      setDone(true);
    } catch (e) {
      setError((e as ApiError).message);
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-2xl mb-2">{t.thanks}</h1>
        <Link href="/" className="btn-primary mt-4 inline-flex">{t.back}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain mb-2">{t.title}</h1>
        <p className="text-sm text-brand-textmuted">{t.body}</p>
        <p className="text-xs font-mono text-brand-gold mt-2">{code}</p>
      </header>

      <div className="card-soft space-y-4">
        {/* Star rating row — chunky for mobile thumb taps */}
        <div className="flex justify-center gap-1.5 py-3">
          {[1, 2, 3, 4, 5].map(n => {
            const filled = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
                aria-label={`${n} sao`}
              >
                <Star className={cn(
                  'h-10 w-10 sm:h-12 sm:w-12 transition-colors',
                  filled ? 'fill-brand-gold text-brand-gold' : 'text-brand-cream'
                )} />
              </button>
            );
          })}
        </div>

        <Field label={t.phone}>
          <input type="tel" required inputMode="tel" value={phone}
            onChange={e => setPhone(e.target.value)}
            className="fi" autoComplete="tel" />
        </Field>

        <Field label={t.comment}>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            rows={3} maxLength={1000}
            className="fi resize-none" />
        </Field>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button onClick={submit} disabled={busy || rating < 1 || !phone}
          className="btn-primary w-full justify-center disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t.submit}
        </button>
      </div>

      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 12px 14px;
              font-size: 16px; background: #faf9f6; color: #4a443e; outline: none; transition: border 0.2s; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
