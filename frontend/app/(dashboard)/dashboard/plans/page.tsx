// frontend/app/(dashboard)/dashboard/plans/page.tsx

import PlansBillingClient from '@/components/dashboard/PlansBillingClient';

export default function PlansPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-mono text-sm uppercase tracking-[0.2em] text-neutral-200">
          Plans &amp; Billing
        </h1>
        <p className="font-mono text-xs text-neutral-500 max-w-xl">
          Deterministic view of subscription truth. Stripe on the right,
          database on the left. No magic.
        </p>
      </header>

      <PlansBillingClient />
    </div>
  );
}



