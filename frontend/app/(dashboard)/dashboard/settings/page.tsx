// frontend/app/(dashboard)/dashboard/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-mono">/dashboard/settings</h1>
      <p className="text-xs text-gray-400 font-mono">
        This panel will expose system-level flags, global defaults, and
        environment configuration hints. No production knobs yet—just wiring.
      </p>
    </div>
  );
}
