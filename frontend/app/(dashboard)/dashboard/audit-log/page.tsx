// frontend/app/(dashboard)/dashboard/audit-log/page.tsx
import AuditLogClient from '@/components/dashboard/AuditLogClient';

export default function AuditLogPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-1">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-200">
          Audit Log
        </h1>
        <p className="text-xs text-neutral-400">
          Read-only view of recent billing-related events. This demo tracks local
          checkout and sync actions and can be extended to include Stripe webhook events.
        </p>
      </header>

      <AuditLogClient />
    </div>
  );
}

