// frontend/components/dashboard/AuditLogClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type BillingEventSource = 'local' | 'stripe_webhook';

interface BillingEvent {
  id: string;
  createdAt: string;
  type: string;
  source: BillingEventSource;
  summary: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function formatSource(source: BillingEventSource): string {
  switch (source) {
    case 'local':
      return 'LOCAL';
    case 'stripe_webhook':
      return 'STRIPE WEBHOOK';
    default:
      return source.toUpperCase();
  }
}

export default function AuditLogClient() {
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/billing/webhook-events');
      const json = res as ApiResponse<BillingEvent[]>;

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to load billing events');
      }

      setEvents(json.data);
    } catch (err: any) {
      console.error('Failed to load billing events:', err);
      setError(err?.message || 'Failed to load billing events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>
          Recent billing events for this environment. Newest at the top. This buffer
          resets when the server restarts.
        </span>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="border border-neutral-700 bg-neutral-950 px-3 py-1 text-[11px] uppercase tracking-wide text-neutral-100 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="border border-red-700 bg-red-950 px-4 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="border border-neutral-900 bg-black">
        <div className="grid grid-cols-4 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
          <div>Time</div>
          <div>Type</div>
          <div>Source</div>
          <div>Summary</div>
        </div>
        {events.length === 0 ? (
          <div className="px-3 py-3 text-xs text-neutral-400">
            No billing events recorded yet. Trigger an upgrade or sync to generate activity.
          </div>
        ) : (
          <div className="divide-y divide-neutral-900 text-xs">
            {events.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-4 gap-2 px-3 py-2 hover:bg-neutral-950"
              >
                <div className="font-mono text-[11px] text-neutral-300">
                  {new Date(e.createdAt).toLocaleString()}
                </div>
                <div className="font-mono text-[11px] text-neutral-100">
                  {e.type}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {formatSource(e.source)}
                </div>
                <div className="text-[11px] text-neutral-200">{e.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
