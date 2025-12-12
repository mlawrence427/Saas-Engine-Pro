// frontend/components/dashboard/PlansBillingClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PlanTruthPanel from './PlanTruthPanel';

interface CheckoutSessionResponse {
  success: boolean;
  data?: {
    url: string;
  };
  error?: string;
}

interface SyncResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export default function PlansBillingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutStatus = searchParams.get('checkout');

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerTone, setBannerTone] = useState<'neutral' | 'success' | 'error'>(
    'neutral'
  );
  const [error, setError] = useState<string | null>(null);
  const [autoSynced, setAutoSynced] = useState(false);

  // Handle checkout=success query param: show banner and attempt auto-sync once.
  useEffect(() => {
    if (checkoutStatus === 'success' && !autoSynced) {
      setBanner('Checkout completed. Syncing billing state…');
      setBannerTone('neutral');
      setAutoSynced(true);
      void handleSync(true);
    } else if (checkoutStatus === 'cancelled') {
      setBanner('Checkout cancelled. No changes were made.');
      setBannerTone('neutral');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutStatus]);

  async function handleUpgrade() {
    setIsUpgrading(true);
    setError(null);
    setBanner(null);

    try {
      const res = (await apiFetch(
        '/api/billing/create-checkout-session',
        {
          method: 'POST',
        }
      )) as CheckoutSessionResponse;

      if (!res.success || !res.data?.url) {
        throw new Error(res.error || 'Failed to create Checkout Session.');
      }

      // Hard redirect to Stripe Checkout
      window.location.href = res.data.url;
    } catch (err: any) {
      setError(err?.message || 'Failed to start upgrade.');
      setBanner('Failed to start upgrade. See error below.');
      setBannerTone('error');
      setIsUpgrading(false);
    }
  }

  async function handleSync(isAuto = false) {
    setIsSyncing(true);
    setError(null);

    try {
      const res = (await apiFetch('/api/billing/sync', {
        method: 'POST',
      })) as SyncResponse;

      if (!res.success) {
        throw new Error(
          res.error || 'Sync failed. Check Stripe configuration.'
        );
      }

      setBanner(
        isAuto
          ? 'Billing state synced from Stripe.'
          : 'Manual sync successful. Plan updated from Stripe.'
      );
      setBannerTone('success');

      // Bump refresh signal so PlanTruthPanel refetches.
      setRefreshSignal((v) => v + 1);

      // Clean up the checkout query param if we just handled an auto-sync.
      if (isAuto && checkoutStatus === 'success') {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.delete('checkout');
        router.replace(`/dashboard/plans${params.toString() ? `?${params}` : ''}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sync from Stripe.');
      setBanner('Failed to sync billing state from Stripe.');
      setBannerTone('error');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={[
            'border px-3 py-2 text-xs font-mono uppercase tracking-wide',
            bannerTone === 'success'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
              : bannerTone === 'error'
              ? 'border-red-500 text-red-400 bg-red-950/40'
              : 'border-neutral-600 text-neutral-300 bg-neutral-900',
          ].join(' ')}
        >
          {banner}
        </div>
      )}

      <div className="border border-neutral-800 bg-black p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase text-neutral-400">
              Plan Controls
            </div>
            <div className="font-mono text-xs text-neutral-200">
              Upgrade and sync against Stripe billing truth.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="px-3 py-1 border border-neutral-700 bg-neutral-950 text-neutral-100 text-xs font-mono uppercase tracking-wide hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpgrading ? 'Redirecting…' : 'Upgrade to PRO'}
            </button>
            <button
              type="button"
              onClick={() => handleSync(false)}
              disabled={isSyncing}
              className="px-3 py-1 border border-neutral-700 bg-neutral-950 text-neutral-100 text-xs font-mono uppercase tracking-wide hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Syncing…' : 'Resync from Stripe'}
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-700 bg-red-950/40 text-red-300 text-xs font-mono px-3 py-2 mt-2">
            Error: {error}
          </div>
        )}
      </div>

      <PlanTruthPanel refreshSignal={refreshSignal} />
    </div>
  );
}
