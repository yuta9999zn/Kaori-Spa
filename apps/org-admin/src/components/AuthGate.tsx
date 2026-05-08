'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import OrgShell from './OrgShell';

const ALLOWED_ROLES = ['ORG_OWNER', 'ORG_MANAGER', 'TENANT_OWNER', 'ACCOUNTANT', 'MARKETING'];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthed, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';

  const allowedRole = isAuthed && (user?.roles ?? []).some(r => ALLOWED_ROLES.includes(r));

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

  if (!allowedRole) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h1 className="font-serif text-2xl mb-2">Không có quyền</h1>
        <p className="text-sm text-brand-textmuted">
          Cổng quản lý tổ chức yêu cầu vai trò: ORG_OWNER, ORG_MANAGER hoặc TENANT_OWNER.
        </p>
      </div>
    );
  }

  return <OrgShell>{children}</OrgShell>;
}
