'use client';

import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

/**
 * In-page protection. Use as <AccessGuard roles={['BRANCH_MANAGER']}>...</AccessGuard>
 * to hide page content from users without one of the listed roles.
 *
 * The sidebar already filters menu items, but a user can still hit the URL
 * directly — this component covers that case with a friendly forbidden state.
 */
export default function AccessGuard({
  roles,
  children
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const allowed = (user?.roles ?? []).some(r => roles.includes(r));
  if (allowed) return <>{children}</>;
  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Lock className="h-8 w-8" />
      </div>
      <h1 className="font-serif text-2xl text-brand-textmain mb-2">Không có quyền truy cập</h1>
      <p className="text-sm text-brand-textmuted">
        Vai trò của bạn ({(user?.roles ?? []).join(', ') || 'unknown'}) không đủ để xem trang này.
      </p>
      <p className="mt-4 text-xs text-brand-textmuted">
        Cần một trong: <span className="font-mono">{roles.join(', ')}</span>
      </p>
    </div>
  );
}
