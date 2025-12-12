// frontend/app/(dashboard)/dashboard/audit-log/page.tsx
export default function AuditLogPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-mono">/dashboard/audit-log</h1>
      <p className="text-xs text-gray-400 font-mono">
        This will list immutable events for plan changes, role escalations, and
        manual overrides, with timestamps and actor identity.
      </p>
    </div>
  );
}
