'use client';

import { useState } from 'react';
import { Loader2, Phone, User, Mail, AlertCircle, LogOut, Calendar } from 'lucide-react';
import { signup, loginByPhone, logoutCustomer, useCustomerAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Link } from '@/i18n/routing';

const LABELS: Record<string, Record<'login' | 'signup' | 'phone' | 'password' | 'name' | 'email' | 'submit' | 'switchToSignup' | 'switchToLogin' | 'welcome' | 'logout' | 'history', string>> = {
  vi: { login: 'Đăng nhập', signup: 'Đăng ký', phone: 'Số điện thoại', password: 'Mật khẩu',
        name: 'Họ tên', email: 'Email (tuỳ chọn)', submit: 'Tiếp tục',
        switchToSignup: 'Chưa có tài khoản? Đăng ký',
        switchToLogin: 'Đã có tài khoản? Đăng nhập',
        welcome: 'Xin chào', logout: 'Đăng xuất', history: 'Lịch sử đặt lịch' },
  en: { login: 'Sign in', signup: 'Sign up', phone: 'Phone', password: 'Password',
        name: 'Full name', email: 'Email (optional)', submit: 'Continue',
        switchToSignup: 'No account? Sign up',
        switchToLogin: 'Have an account? Sign in',
        welcome: 'Welcome', logout: 'Sign out', history: 'Booking history' },
  ja: { login: 'ログイン', signup: '新規登録', phone: '電話番号', password: 'パスワード',
        name: '氏名', email: 'メール (任意)', submit: '続ける',
        switchToSignup: 'アカウントなし? 登録',
        switchToLogin: 'アカウントあり? ログイン',
        welcome: 'ようこそ', logout: 'ログアウト', history: '予約履歴' },
  zh: { login: '登录', signup: '注册', phone: '电话', password: '密码',
        name: '姓名', email: '邮箱(可选)', submit: '继续',
        switchToSignup: '没有账号? 注册', switchToLogin: '已有账号? 登录',
        welcome: '欢迎', logout: '登出', history: '预约历史' },
  ko: { login: '로그인', signup: '가입', phone: '전화번호', password: '비밀번호',
        name: '성함', email: '이메일 (선택)', submit: '계속',
        switchToSignup: '계정이 없습니까? 가입', switchToLogin: '계정이 있습니까? 로그인',
        welcome: '환영합니다', logout: '로그아웃', history: '예약 이력' }
};

export default function AccountPanel({ locale }: { locale: string }) {
  const { profile, isAuthed, refresh } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ phone: '', password: '', fullName: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = LABELS[locale] ?? LABELS.vi;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === 'login') {
        await loginByPhone(form.phone, form.password);
      } else {
        await signup({
          phone: form.phone,
          password: form.password,
          email: form.email || undefined,
          fullName: form.fullName || undefined,
          locale
        });
      }
      refresh();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  if (isAuthed && profile) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card-soft text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold font-serif text-xl">
            {profile.fullName?.charAt(0) ?? profile.phone.slice(-2)}
          </div>
          <h1 className="font-serif text-2xl text-brand-textmain mb-1">
            {t.welcome}, {profile.fullName ?? profile.phone}
          </h1>
          <p className="text-sm text-brand-textmuted">{profile.phone}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/account/bookings" className="card-soft flex items-center gap-3 hover:border-brand-gold transition">
            <Calendar className="h-5 w-5 text-brand-gold" />
            <span className="font-medium">{t.history}</span>
          </Link>
          <button
            onClick={() => { logoutCustomer(); refresh(); }}
            className="card-soft flex items-center gap-3 hover:border-rose-200 transition"
          >
            <LogOut className="h-5 w-5 text-rose-500" />
            <span className="font-medium">{t.logout}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="text-center mb-6">
        <h1 className="font-serif text-3xl text-brand-textmain mb-2">
          {mode === 'login' ? t.login : t.signup}
        </h1>
        <p className="text-sm text-brand-textmuted">Natural Beauty</p>
      </header>

      <form onSubmit={submit} className="card-soft space-y-4">
        <Field label={t.phone}>
          <input type="tel" required value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="fi" placeholder="09xx xxx xxx" autoComplete="tel" />
        </Field>

        {mode === 'signup' && (
          <Field label={t.name}>
            <input value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="fi" />
          </Field>
        )}

        <Field label={t.password}>
          <input type="password" required value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="fi" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </Field>

        {mode === 'signup' && (
          <Field label={t.email}>
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="fi" />
          </Field>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={busy || !form.phone || !form.password}
          className="btn-primary w-full justify-center disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.submit}
        </button>

        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="block w-full text-center text-xs text-brand-gold hover:underline">
          {mode === 'login' ? t.switchToSignup : t.switchToLogin}
        </button>
      </form>

      <style jsx>{`
        .fi { width: 100%; border: 1px solid #f4efea; border-radius: 12px; padding: 10px 14px;
              font-size: 14px; background: #faf9f6; color: #4a443e; outline: none; transition: border 0.2s; }
        .fi:focus { border-color: #c9a87c; box-shadow: 0 0 0 3px rgba(201,168,124,0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-brand-textmuted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
