'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Locale } from '@/i18n/routing';

const AI_BASE = process.env.NEXT_PUBLIC_AI_BASE ?? 'http://localhost:8090';
const TENANT = 'natural-beauty';

const greetings: Record<Locale, string> = {
  vi: 'Xin chào 👋 Mình là trợ lý Natural Beauty. Bạn cần tư vấn dịch vụ nào hôm nay?',
  en: 'Hi 👋 I am the Natural Beauty assistant. How may I help you today?',
  ja: 'こんにちは 👋 Natural Beauty のアシスタントです。本日のご希望は?',
  zh: '您好 👋 我是 Natural Beauty 助手。今天想了解哪项服务?',
  ko: '안녕하세요 👋 Natural Beauty 어시스턴트입니다. 오늘 어떤 도움이 필요하세요?'
};

const placeholders: Record<Locale, string> = {
  vi: 'Hỏi về dịch vụ, giá, đặt lịch...',
  en: 'Ask about services, prices, booking...',
  ja: 'サービス・料金・予約についてご質問ください...',
  zh: '问问服务、价格、预约...',
  ko: '서비스·가격·예약 관련 질문...'
};

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', content: greetings[locale] }]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open]);

  // Reset greeting on locale change.
  useEffect(() => {
    setMsgs([{ role: 'assistant', content: greetings[locale] }]);
  }, [locale]);

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;
    setInput('');
    const next: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setPending(true);

    try {
      const res = await fetch(`${AI_BASE}/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: TENANT,
          locale,
          messages: next.map(m => ({ role: m.role, content: m.content })),
          stream: false
        })
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: 'assistant', content: data.content ?? '...' }]);
    } catch {
      setMsgs(m => [
        ...m,
        {
          role: 'assistant',
          content: locale === 'vi'
            ? 'Xin lỗi, kết nối tạm thời gặp lỗi. Vui lòng thử lại.'
            : 'Sorry, the connection failed. Please try again.'
        }
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Chat"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-premium transition',
          open
            ? 'bg-brand-textmain text-white'
            : 'bg-brand-gold text-white hover:bg-brand-goldhover'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-brand-cream bg-white shadow-premium">
          <header className="flex items-center gap-3 px-5 py-4 border-b border-brand-cream bg-gradient-to-br from-brand-gold/10 via-white to-brand-rose/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-none">
              <p className="font-serif text-sm tracking-wider text-brand-textmain">Natural Beauty</p>
              <p className="text-[10px] uppercase tracking-widest text-brand-textmuted mt-1">
                Kaori AI · {locale.toUpperCase()}
              </p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-brand-ivory/40">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'ml-auto bg-brand-gold text-white'
                    : 'mr-auto bg-white border border-brand-cream text-brand-textmain'
                )}
              >
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="mr-auto rounded-2xl bg-white border border-brand-cream px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-gold" />
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-brand-cream px-3 py-3 bg-white"
            onSubmit={e => { e.preventDefault(); send(); }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholders[locale]}
              className="flex-1 rounded-full border border-brand-cream bg-brand-ivory px-4 py-2 text-sm outline-none focus:border-brand-gold"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-white transition hover:bg-brand-goldhover disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
