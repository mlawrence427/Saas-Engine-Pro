// frontend/components/dashboard/StatsCards.tsx
'use client';

type StatsCardsProps = {
  plan: string;
  role: string;
  createdAtDisplay: string;
};

export function StatsCards({ plan, role, createdAtDisplay }: StatsCardsProps) {
  const normalizedPlan = plan || 'UNKNOWN';
  const normalizedRole = role || 'USER';

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="border border-gray-800 bg-gray-950 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-mono">
          Current Plan
        </div>
        <div className="mt-1 text-lg font-mono text-gray-100">
          {normalizedPlan}
        </div>
        <p className="mt-2 text-[11px] text-gray-400 font-mono">
          This value is coming from the JWT payload and will be governed by
          Stripe in Phase 2.
        </p>
      </div>

      <div className="border border-gray-800 bg-gray-950 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-mono">
          Role
        </div>
        <div className="mt-1 text-lg font-mono text-gray-100">
          {normalizedRole}
        </div>
        <p className="mt-2 text-[11px] text-gray-400 font-mono">
          Roles gate access to internal panels and modules. Founder / Admin /
          Operator are the first-class citizens.
        </p>
      </div>

      <div className="border border-gray-800 bg-gray-950 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-mono">
          Account Created
        </div>
        <div className="mt-1 text-lg font-mono text-gray-100">
          {createdAtDisplay}
        </div>
        <p className="mt-2 text-[11px] text-gray-400 font-mono">
          This is the timestamp from your User record—the system of record for
          identity in SaaS Engine.
        </p>
      </div>
    </section>
  );
}
