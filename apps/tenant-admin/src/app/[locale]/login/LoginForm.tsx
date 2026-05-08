'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { loginRequest, useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('admin@kaori.io');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await loginRequest(email, password);
      refresh();
      router.replace('/');
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.code === 'AUTH_BAD_CREDENTIALS' ? 'Email hoặc mật khẩu không đúng' :
        err.code === 'AUTH_LOCKED'          ? 'Tài khoản tạm khoá. Thử lại sau 10 phút.' :
        err.message || 'Có lỗi xảy ra'
      );
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-brand-textmain via-[#5a5450] to-[#3a3530]">
      <div className="w-full max-w-md">
        <header className="text-center mb-8 text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/20 text-brand-gold">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-2xl tracking-[0.2em]">KAORI</h1>
          <p className="text-xs uppercase tracking-[0.25em] text-white/60 mt-1">Tenant Administrator</p>
        </header>

        <form onSubmit={submit} className="rounded-3xl border border-brand-cream/20 bg-white/95 backdrop-blur p-6 shadow-soft space-y-4">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1.5">Email</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="fi" autoComplete="email" />
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-brand-textmuted mb-1.5">Mật khẩu</span>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                className="fi pr-10" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textmuted hover:text-brand-gold">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={busy || !email || !password}
            className="btn-primary w-full justify-center disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Đăng nhập
          </button>

          <p className="text-center text-xs text-brand-textmuted pt-2">
            Cần 2FA? Nhập OTP sau khi đăng nhập.
          </p>
        </form>

        <style jsx>{`
          .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 10px 14px; font-size: 14px; background: #faf9f6; color: #4a443e; outline: none; transition: border 0.2s; }
          .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
        `}</style>
      </div>
    </div>
  );
}
