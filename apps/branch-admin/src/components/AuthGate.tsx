'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import AdminShell from './AdminShell';

/**
 * Gates the app behind authentication.
 *
 * - On `/login` → renders the children directly (no shell, no auth required).
 * - Anywhere else → if not authenticated, redirects to `/login`.
 * - Authenticated → wraps children with AdminShell.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthed, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';

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

  return <AdminShell>{children}</AdminShell>;
}
