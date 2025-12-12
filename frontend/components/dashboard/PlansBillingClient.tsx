// frontend/components/dashboard/PlansBillingClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PlanTruthPanel } from './PlanTruthPanel';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface CheckoutData {
  url: string;
}

function PlansBillingClientInner() {
  const [banner, setBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle ?checkout=success / ?checkout=cancelled
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const checkoutStatus = url.searchParams.get('checkout');

    if (checkoutStatus === 'success') {
      setBanner({
        type: 'info',
        message:
          'Checkout completed. Fetching subscription from Stripe and updating DB plan…',
      });

      // Trigger sync automatically (silent=true so we don’t clear the banner)
      handleSyncFromStripe(true);

      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    } else if (checkoutStatus === 'cancelled') {
      setBanner({
        type: 'error',
        message: 'Checkout was cancelled. No changes were made.',
      });
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgradeToPro = async () => {
    setBanner(null);
    setIsCreatingCheckout(true);

    try {
      const res = await apiFetch('/api/billing/create-checkout-session', {
        method: 'POST',
      });

      const json = res as ApiResponse<CheckoutData>;

      if (!json.success || !json.data?.url) {
        throw new Error(json.error || 'Failed to create Checkout session');
      }

      window.location.href = json.data.url;
    } catch (err: any) {
      console.error('Failed to start upgrade:', err);
      setBanner({
        type: 'error',
        message:
          err?.message ||
          'Failed to start upgrade. Check backend logs and Stripe configuration.',
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleSyncFromStripe = async (silent = false) => {
    if (!silent) {
      setBanner(null);
    }
    setIsSyncing(true);

    try {
      const res = await apiFetch('/api/billing/sync', {
        method: 'POST',
      });

      const json = res as ApiResponse<unknown>;

      if (!json.success) {
        throw new Error(
          json.error ||
            'Failed to pull current state from Stripe. See server logs for details.'
        );
      }

      setRefreshKey((k) => k + 1);

      setBanner({
        type: 'success',
        message:
          'Plan updated using current Stripe subscription state. Internal plan now reflects Stripe truth.',
      });
    } catch (err: any) {
      console.error('Failed to sync from Stripe:', err);
      setBanner({
        type: 'error',
        message:
          err?.message ||
          'Failed to pull current state from Stripe. Check backend logs and Stripe configuration.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top banner */}
      {banner && (
        <div
          className={`border px-4 py-2 text-xs ${
            banner.type === 'success'
              ? 'border-emerald-700 bg-emerald-950 text-emerald-200'
              : banner.type === 'error'
              ? 'border-red-700 bg-red-950 text-red-200'
              : 'border-neutral-700 bg-neutral-950 text-neutral-200'
          }`}
        >
          {banner.message}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 border border-neutral-900 bg-black p-4 text-xs text-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
              Plan Controls
            </span>
            <span className="text-[11px] text-neutral-400">
              Upgrade and reconcile against Stripe billing truth.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpgradeToPro}
              disabled={isCreatingCheckout || isSyncing}
              className="border border-neutral-700 bg-neutral-950 px-3 py-1 text-[11px] uppercase tracking-wide text-neutral-100 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingCheckout ? 'Redirecting…' : 'Upgrade to PRO'}
            </button>
            <button
              onClick={() => handleSyncFromStripe(false)}
              disabled={isSyncing || isCreatingCheckout}
              className="border border-neutral-700 bg-neutral-950 px-3 py-1 text-[11px] uppercase tracking-wide text-neutral-100 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? 'Pulling from Stripe…' : 'Pull current state from Stripe'}
            </button>
          </div>
        </div>
      </div>

      {/* Plan Truth */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-300">
          Plan Truth
        </h3>
        <p className="mb-2 text-[11px] text-neutral-400">
          Local Enforcement (DB) on the left. External Truth (Stripe) on the right. Status
          shows whether they currently agree.
        </p>
        <PlanTruthPanel refreshKey={refreshKey} />
      </div>
    </div>
  );
}

// Named export (if you ever want it)
export function PlansBillingClient() {
  return <PlansBillingClientInner />;
}

// Default export used by the page component
export default PlansBillingClientInner;


