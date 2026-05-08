'use client';

import { useRef, useState } from 'react';
import { Flower2, Loader2, AlertCircle, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { loginRequest, verifyOtp, useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('miko@naturalbeauty.vn');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const otpRef = useRef<HTMLInputElement>(null);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const out = await loginRequest(email, password);
      if (out.step === 'ok') {
        refresh();
        router.replace('/');
      } else {
        setPendingToken(out.pendingToken);
        setTimeout(() => otpRef.current?.focus(), 50);
      }
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.code === 'AUTH_BAD_CREDENTIALS' ? 'Email hoặc mật khẩu không đúng' :
        err.code === 'AUTH_LOCKED'          ? 'Tài khoản tạm khoá. Thử lại sau 10 phút.' :
        err.message || 'Có lỗi xảy ra'
      );
    } finally { setBusy(false); }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingToken) return;
    setBusy(true); setError(null);
    try {
      await verifyOtp(pendingToken, otp);
      refresh();
      router.replace('/');
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.code === 'AUTH_2FA_INVALID'  ? 'Mã OTP không đúng' :
        err.code === 'AUTH_TOKEN_EXPIRED' ? 'Phiên xác thực hết hạn, đăng nhập lại' :
        err.message || 'Có lỗi xảy ra'
      );
      if (err.code === 'AUTH_TOKEN_EXPIRED') setPendingToken(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-ivory via-brand-cream to-brand-lavender/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
            {pendingToken ? <KeyRound className="h-7 w-7" strokeWidth={1.5} /> : <Flower2 className="h-7 w-7" strokeWidth={1.5} />}
          </div>
          <h1 className="font-serif text-2xl tracking-[0.2em] text-brand-textmain">NATURAL BEAUTY</h1>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-textmuted mt-1">
            {pendingToken ? 'Xác thực 2 lớp' : 'Branch Console · Kaori'}
          </p>
        </header>

        {!pendingToken ? (
          <form onSubmit={submitPassword} className="card-soft space-y-4">
            <Field label="Email">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="fi" autoComplete="email" />
            </Field>
            <Field label="Mật khẩu">
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="fi pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textmuted hover:text-brand-gold">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            {error && <ErrorBox text={error} />}
            <button type="submit" disabled={busy || !email || !password}
              className="btn-primary w-full justify-center disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Đăng nhập
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="card-soft space-y-4">
            <p className="text-sm text-brand-textmuted text-center">
              Nhập mã 6 chữ số từ ứng dụng Authenticator
            </p>
            <Field label="Mã OTP">
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="fi text-center text-2xl tracking-[0.5em] font-mono"
                autoComplete="one-time-code"
              />
            </Field>
            {error && <ErrorBox text={error} />}
            <button type="submit" disabled={busy || otp.length !== 6}
              className="btn-primary w-full justify-center disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận
            </button>
            <button type="button"
              onClick={() => { setPendingToken(null); setOtp(''); setError(null); }}
              className="block w-full text-center text-xs text-brand-textmuted hover:text-brand-gold">
              <ArrowLeft className="inline h-3 w-3 mr-1" /> Quay lại
            </button>
          </form>
        )}

        <style jsx>{`
          .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 10px 14px;
                font-size: 16px; background: #faf9f6; color: #4a443e; outline: none; transition: border 0.2s; }
          .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
        `}</style>
      </div>
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

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
