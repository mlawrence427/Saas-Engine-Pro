// frontend/components/dashboard/PlanTruthPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type PlanTruthStatus =
  | 'stripe_not_configured'
  | 'no_customer_id'
  | 'no_active_subscription'
  | 'unmapped_price'
  | 'synced'
  | 'desynced'
  | 'stripe_error';

interface PlanTruthStripeInfo {
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  priceId: string | null;
  mappedPlan: string | null;
}

interface PlanTruthPayload {
  internalPlan: string | null;
  status: PlanTruthStatus;
  stripe: PlanTruthStripeInfo;
  details?: string | null;
}

interface PlanTruthResponse {
  success: boolean;
  data?: PlanTruthPayload;
  error?: string;
}

interface PlanTruthPanelProps {
  /**
   * Changing this value forces a refetch.
   * The parent can bump a counter after sync or other actions.
   */
  refreshSignal?: number;
}

export default function PlanTruthPanel({ refreshSignal }: PlanTruthPanelProps) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<PlanTruthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlanTruth() {
    setLoading(true);
    setError(null);

    try {
      const res = (await apiFetch('/api/billing/plan-truth')) as PlanTruthResponse;

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to load plan truth.');
      }

      setPayload(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load plan truth.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlanTruth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  return (
    <div className="border border-neutral-700 bg-black text-neutral-100 p-4 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wide">
          Plan Truth
        </h2>
        {payload ? (
          <span
            className={[
              'px-2 py-0.5 border text-[10px] font-mono uppercase',
              payload.status === 'synced'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-amber-500 text-amber-400',
            ].join(' ')}
          >
            {payload.status}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="font-mono text-xs text-neutral-400">
          Loading plan truth…
        </div>
      )}

      {error && !loading && (
        <div className="font-mono text-xs text-red-400">
          Error: {error}
        </div>
      )}

      {!loading && !error && payload && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] leading-relaxed">
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-neutral-400">
              Internal
            </div>
            <div className="border border-neutral-700 p-2">
              <div className="flex justify-between">
                <span>plan</span>
                <span className="font-semibold">
                  {payload.internalPlan ?? 'null'}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">
                Internal DB field <code>User.plan</code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase text-neutral-400">
              Stripe
            </div>
            <div className="border border-neutral-700 p-2 space-y-1">
              <div className="flex justify-between">
                <span>mappedPlan</span>
                <span className="font-semibold">
                  {payload.stripe.mappedPlan ?? 'null'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>priceId</span>
                <span className="truncate max-w-[200px]">
                  {payload.stripe.priceId ?? 'null'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>subscriptionStatus</span>
                <span>{payload.stripe.subscriptionStatus ?? 'null'}</span>
              </div>
              <div className="mt-1 text-[10px] text-neutral-400">
                Derived from Stripe subscriptions for{' '}
                <code>{payload.stripe.customerId ?? 'no-customer'}</code>
              </div>
            </div>
          </div>

          {payload.details && (
            <div className="md:col-span-2 border border-neutral-700 p-2 bg-neutral-950/60">
              <div className="text-[10px] uppercase text-neutral-400 mb-1">
                Details
              </div>
              <div>{payload.details}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



