'use client';

import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import TenantShell from './TenantShell';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'TENANT_OWNER'];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthed, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';
  const allowed = isAuthed && (user?.roles ?? []).some(r => ALLOWED_ROLES.includes(r));

  useEffect(() => {
    if (loading) return;
    if (!isAuthed && !isLogin) router.replace('/login');
    if (isAuthed && isLogin)   router.replace('/');
  }, [loading, isAuthed, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (loading || !isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="font-serif text-2xl mb-2">Không có quyền</h1>
        <p className="text-sm text-brand-textmuted">
          Cổng quản trị nền tảng Kaori chỉ dành cho SUPER_ADMIN hoặc TENANT_OWNER.
        </p>
      </div>
    );
  }

  return <TenantShell>{children}</TenantShell>;
}
