import { setRequestLocale } from 'next-intl/server';
import AuditLogView from './AuditLogView';

// Audit events surface backed by GET /v1/audit-events on tenant-service.
// See AuditLogView.tsx for the client view.
export default async function AuditPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuditLogView />;
}
