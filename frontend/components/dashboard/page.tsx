// frontend/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { PlanTruthPanel } from '@/components/dashboard/PlanTruthPanel';

type MeUser = {
  userId: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
};

type MeResponse = {
  success: true;
  data: {
    user: MeUser;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = (await apiFetch('/api/auth/me')) as MeResponse;
      setUser(res.data.user);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          router.push('/login');
          return;
        }
        setErrorMessage(
          `Failed to load your account (HTTP ${err.status}). Please try again.`
        );
      } else {
        setErrorMessage('Failed to load your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  if (loading && !user) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-56 bg-gray-900 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 bg-gray-900 animate-pulse" />
          <div className="h-24 bg-gray-900 animate-pulse" />
          <div className="h-24 bg-gray-900 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 bg-gray-900 animate-pulse" />
          <div className="h-40 bg-gray-900 animate-pulse" />
          <div className="h-40 bg-gray-900 animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMessage && !user) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="text-xl font-mono text-red-400">/dashboard error</h1>
        <p className="text-sm text-gray-300">{errorMessage}</p>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => void loadMe()}
            className="border border-gray-700 px-3 py-1 font-mono uppercase tracking-wide hover:bg-gray-900"
          >
            retry /me
          </button>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="border border-gray-700 px-3 py-1 font-mono uppercase tracking-wide hover:bg-gray-900"
          >
            go to /login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const created = new Date(user.createdAt);
  const createdDisplay = isNaN(created.getTime())
    ? user.createdAt
    : created.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });

  const welcomeLabel = user.email || user.role || 'founder';

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-mono">
          Welcome, <span className="text-emerald-400">{welcomeLabel}</span>
        </h1>
        <p className="text-xs text-gray-400 font-mono">
          This is your post-sale control plane. Auth is live and state is being
          read from the JWT.
        </p>
      </section>

      <StatsCards
        plan={user.plan}
        role={user.role}
        createdAtDisplay={createdDisplay}
      />

      {/* Plan truth row */}
      <PlanTruthPanel plan={user.plan} />

      {/* Placeholder modules */}
      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title="Modules"
          badge="coming soon"
          description="AI modules & governance blocks live here. Each module will read your plan & role from SaaS Engine and emit signals—not magic."
        >
          <ul className="text-xs text-gray-300 font-mono space-y-1">
            <li>• Plan-gated AI access</li>
            <li>• Feature flags by role</li>
            <li>• Deterministic governance flows</li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Plans & Billing"
          badge="next phase"
          description="Stripe-backed plan truth, desync detection, and downgrade paths. This panel will connect your billing system to access rules."
        >
          <ul className="text-xs text-gray-300 font-mono space-y-1">
            <li>• Plan truth vs app truth</li>
            <li>• One-click resync</li>
            <li>• Explicit downgrade & cancel flows</li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Audit Log"
          badge="next phase"
          description="Immutable log of access and billing changes. Every plan flip and role change will be recorded as a mechanical event."
        >
          <ul className="text-xs text-gray-300 font-mono space-y-1">
            <li>• Plan change events</li>
            <li>• Role escalations</li>
            <li>• Manual overrides</li>
          </ul>
        </SectionCard>
      </section>
    </div>
  );
}
