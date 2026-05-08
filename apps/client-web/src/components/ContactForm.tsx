'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Check } from 'lucide-react';

export default function ContactForm() {
  const t = useTranslations('contact.form');
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="card-soft grid gap-4 sm:grid-cols-2"
    >
      <Field label={t('name')}>
        <input className="fi" required />
      </Field>
      <Field label={t('email')}>
        <input className="fi" type="email" required />
      </Field>
      <Field label={t('subject')} className="sm:col-span-2">
        <input className="fi" required />
      </Field>
      <Field label={t('message')} className="sm:col-span-2">
        <textarea className="fi min-h-[140px]" required />
      </Field>

      <div className="sm:col-span-2 flex items-center justify-end gap-3">
        {submitted && (
          <span className="text-sm text-emerald-600 flex items-center gap-1">
            <Check className="h-4 w-4" /> ✓
          </span>
        )}
        <button type="submit" className="btn-primary">
          {t('send')} <Send className="h-4 w-4" />
        </button>
      </div>

      <style jsx>{`
        .fi {
          width: 100%;
          border: 1px solid #f4efea;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          background: #faf9f6;
          color: #4a443e;
          outline: none;
          transition: border 0.2s;
        }
        .fi:focus {
          border-color: #c9a87c;
          box-shadow: 0 0 0 3px rgba(201, 168, 124, 0.1);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-[11px] uppercase tracking-widest text-brand-textmuted mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
