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

type StripeMode = 'test' | 'live' | 'unknown';

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
  lastCheckedAt: string;
  stripeMode: StripeMode;
}

interface ApiResponse {
  success: boolean;
  data?: PlanTruthPayload;
  error?: string;
  message?: string;
}

interface PlanTruthPanelProps {
  refreshKey?: number;
}

function statusLabel(status: PlanTruthStatus): string {
  switch (status) {
    case 'synced':
      return 'IN SYNC';
    case 'desynced':
      return 'MISMATCH';
    case 'no_customer_id':
      return 'NO STRIPE CUSTOMER';
    case 'no_active_subscription':
      return 'NO ACTIVE SUBSCRIPTION';
    case 'unmapped_price':
      return 'UNMAPPED PRICE';
    case 'stripe_not_configured':
      return 'STRIPE NOT CONFIGURED';
    case 'stripe_error':
      return 'STRIPE ERROR';
    default:
      return status;
  }
}

function statusExplanation(payload: PlanTruthPayload): string {
  const { status, internalPlan, stripe, details } = payload;

  switch (status) {
    case 'synced':
      return 'Internal plan matches Stripe. No action required.';
    case 'desynced':
      return `Internal plan (${internalPlan ?? 'none'}) does not match Stripe-mapped plan (${
        stripe.mappedPlan ?? 'none'
      }). Pull current state from Stripe or investigate manual overrides.`;
    case 'no_customer_id':
      return 'User has no associated Stripe customer. They should not have a paid subscription yet.';
    case 'no_active_subscription':
      return 'Stripe customer exists but has no active or trialing subscription. This user should not have paid access.';
    case 'unmapped_price':
      return `Stripe subscription uses price ID ${
        stripe.priceId ?? 'unknown'
      }, which is not mapped to any internal plan in your environment variables.`;
    case 'stripe_not_configured':
      return 'Stripe keys or price IDs are not configured. Only internal plan state is available.';
    case 'stripe_error':
      return 'Failed to fetch billing state from Stripe. Check Stripe API keys, network, or Stripe status.';
    default:
      return details || '';
  }
}

function formatStripeMode(mode: StripeMode): string {
  switch (mode) {
    case 'test':
      return 'TEST';
    case 'live':
      return 'LIVE';
    default:
      return 'UNKNOWN';
  }
}

export function PlanTruthPanel({ refreshKey }: PlanTruthPanelProps) {
  const [data, setData] = useState<PlanTruthPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanTruth = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/billing/plan-truth');
      const json = res as ApiResponse;

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to load plan truth');
      }

      setData(json.data);
    } catch (err: any) {
      console.error('Failed to load plan truth:', err);
      setError(err?.message || 'Failed to load plan truth');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanTruth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <div className="border border-neutral-800 bg-black px-4 py-3 text-sm text-neutral-300">
        Loading billing state…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="border border-red-800 bg-black px-4 py-3 text-sm text-red-400">
        Error loading plan truth: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-neutral-800 bg-black px-4 py-3 text-sm text-neutral-400">
        No plan truth available.
      </div>
    );
  }

  const stripeModeLabel = formatStripeMode(data.stripeMode);

  return (
    <div className="flex flex-col gap-3 border border-neutral-900 bg-black p-4 text-xs text-neutral-200">
      {/* Status + meta */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="border border-neutral-700 bg-neutral-950 px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Integrity Status
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              data.status === 'synced'
                ? 'border border-emerald-600 text-emerald-400'
                : data.status === 'desynced'
                ? 'border border-amber-500 text-amber-300'
                : 'border border-neutral-700 text-neutral-300'
            }`}
          >
            {statusLabel(data.status)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-400">
          <span>
            Last checked:{' '}
            <span className="font-mono text-neutral-200">
              {new Date(data.lastCheckedAt).toLocaleString()}
            </span>
          </span>
          <span>
            Stripe mode:{' '}
            <span
              className={`font-mono ${
                data.stripeMode === 'live'
                  ? 'text-red-400'
                  : data.stripeMode === 'test'
                  ? 'text-emerald-400'
                  : 'text-neutral-400'
              }`}
            >
              {stripeModeLabel}
            </span>
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] text-neutral-300">
        {statusExplanation(data)}
        {data.details && (
          <div className="mt-1 text-[10px] text-neutral-500">{data.details}</div>
        )}
      </div>

      {/* Split panels */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Local / DB */}
        <div className="border border-neutral-800 bg-neutral-950 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Local Enforcement (DB)
            </span>
            <span className="text-[10px] text-neutral-600">
              Source: PostgreSQL &mdash; User.plan
            </span>
          </div>
          <div className="flex items-center justify-between border border-neutral-800 bg-black px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                plan
              </span>
              <span className="font-mono text-sm text-neutral-50">
                {data.internalPlan ?? 'none'}
              </span>
              <span className="mt-1 text-[10px] text-neutral-500">
                Internal DB field <span className="font-mono">User.plan</span>
              </span>
            </div>
          </div>
        </div>

        {/* External / Stripe */}
        <div className="border border-neutral-800 bg-neutral-950 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              External Truth (Stripe)
            </span>
            <span className="text-[10px] text-neutral-600">
              Source: Stripe Subscriptions API
            </span>
          </div>
          <div className="space-y-2 border border-neutral-800 bg-black p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                  mappedPlan
                </span>
                <span className="font-mono text-sm text-neutral-50">
                  {data.stripe.mappedPlan ?? 'none'}
                </span>
                <span className="mt-1 text-[10px] text-neutral-500">
                  Derived from Stripe price ID via env mapping.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex flex-col">
                <span className="uppercase tracking-wide text-neutral-500">
                  priceId
                </span>
                <span className="truncate font-mono text-neutral-200">
                  {data.stripe.priceId ?? 'none'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-wide text-neutral-500">
                  subscriptionStatus
                </span>
                <span className="font-mono text-neutral-200">
                  {data.stripe.subscriptionStatus ?? 'none'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-wide text-neutral-500">
                  customerId
                </span>
                <span className="truncate font-mono text-neutral-200">
                  {data.stripe.customerId ?? 'none'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="uppercase tracking-wide text-neutral-500">
                  subscriptionId
                </span>
                <span className="truncate font-mono text-neutral-200">
                  {data.stripe.subscriptionId ?? 'none'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



