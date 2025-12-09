'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingInfo = {
  success: boolean;
  plan: string;
  billing: {
    subscription: {
      status: string;
      priceId: string | null;
      currentPeriodEnd: string | null;
    } | null;
    hasStripeCustomer: boolean;
  } | null;
};

type ProtectedResponse = {
  ok: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
    plan: string;
  };
};

type AccessError = {
  error: string;
  code: string;
  currentPlan: string;
  requiredPlans: string[];
};

type ProAccessResult =
  | { status: 'success'; data: ProtectedResponse }
  | { status: 'forbidden'; data: AccessError }
  | { status: 'error'; message: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const PRICE_IDS = {
  PRO_MONTHLY:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_POWER || 'price_replace_power',
  PRO_YEARLY:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || 'price_replace_elite',
} as const;

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function Tag({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const map: Record<string, string> = {
    neutral: 'bg-slate-700/60 text-slate-100 border-slate-600',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    danger: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
    info: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 sm:p-5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}

function LoadingSpinner() {
  return (
    <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function DemoPage() {
  // Billing state
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Protected endpoint state
  const [proAccessResult, setProAccessResult] =
    useState<ProAccessResult | null>(null);
  const [proAccessLoading, setProAccessLoading] = useState(false);

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // API calls
  // -------------------------------------------------------------------------

  const fetchBillingInfo = useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);

    try {
      const res = await fetch(`${API_URL}/api/billing/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Not authenticated. Log in first.');
        }
        throw new Error(`Failed to fetch billing info (${res.status})`);
      }

      const data: BillingInfo = await res.json();
      setBillingInfo(data);
    } catch (err) {
      setBillingError(
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setBillingLoading(false);
    }
  }, []);

  const testProAccess = async () => {
    setProAccessLoading(true);
    setProAccessResult(null);

    try {
      const res = await fetch(`${API_URL}/api/protected/pro`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        setProAccessResult({
          status: 'success',
          data: data as ProtectedResponse,
        });
      } else if (res.status === 403) {
        setProAccessResult({
          status: 'forbidden',
          data: data as AccessError,
        });
      } else {
        setProAccessResult({
          status: 'error',
          message: data.error || 'Request failed',
        });
      }
    } catch (err) {
      setProAccessResult({
        status: 'error',
        message:
          err instanceof Error ? err.message : 'Network error',
      });
    } finally {
      setProAccessLoading(false);
    }
  };

  const initiateCheckout = async (priceId: string) => {
    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Checkout failed (${res.status})`
        );
      }

      const data = await res.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Invalid checkout response');
      }
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Checkout failed'
      );
      setCheckoutLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Effects + derived state
  // -------------------------------------------------------------------------

  useEffect(() => {
    fetchBillingInfo();
  }, [fetchBillingInfo]);

  const isProUser = billingInfo?.plan === 'PRO';
  const hasActiveSubscription =
    billingInfo?.billing?.subscription?.status === 'active' ||
    billingInfo?.billing?.subscription?.status === 'trialing';

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
              SaaS Engine Pro · Control Plane Demo
            </h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-400">
              Live mission-control for your revenue system. This page shows how
              Stripe payments, subscription state, and access rules stay in
              lockstep—no zombie sessions, no guessing from cookies.
            </p>
          </div>
          <button
            onClick={fetchBillingInfo}
            disabled={billingLoading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-indigo-500 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 disabled:opacity-50"
          >
            {billingLoading ? <LoadingSpinner /> : 'Refresh state'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Three core blocks */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Left column: State + Mutation */}
          <div className="space-y-5">
            {/* A. IDENTITY & SUBSCRIPTION STATE */}
            <Panel
              title="Identity & Subscription State"
              subtitle="This is the source of truth the rest of your app should trust."
            >
              {billingLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                  <LoadingSpinner />
                  <span className="ml-2">Querying /api/billing/me …</span>
                </div>
              ) : billingError ? (
                <div className="rounded-lg border border-rose-500/50 bg-rose-950/40 p-3 text-xs text-rose-200">
                  <p className="font-medium">Error loading billing state</p>
                  <p className="mt-1 text-rose-300">{billingError}</p>
                </div>
              ) : !billingInfo ? (
                <p className="py-6 text-xs text-slate-400">
                  No billing data found for this session.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* High-level badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone={isProUser ? 'success' : 'neutral'}>
                      Plan: {billingInfo.plan || 'UNKNOWN'}
                    </Tag>
                    <Tag
                      tone={
                        billingInfo.billing?.subscription?.status ===
                          'active' ||
                        billingInfo.billing?.subscription?.status ===
                          'trialing'
                          ? 'success'
                          : billingInfo.billing?.subscription?.status
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      Subscription:{' '}
                      {billingInfo.billing?.subscription?.status ??
                        'none'}
                    </Tag>
                    <Tag
                      tone={
                        billingInfo.billing?.hasStripeCustomer
                          ? 'info'
                          : 'neutral'
                      }
                    >
                      Stripe customer:{' '}
                      {billingInfo.billing?.hasStripeCustomer
                        ? 'connected'
                        : 'not created'}
                    </Tag>
                  </div>

                  {/* Mono console view */}
                  <div className="rounded-xl bg-slate-950/70 p-3 font-mono text-[11px] leading-relaxed text-slate-200 border border-slate-800">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>state.currentUser</span>
                      <span>DB truth snapshot</span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre">
{`{
  plan: "${billingInfo.plan}",
  subscription: ${
    billingInfo.billing?.subscription
      ? `{
    status: "${billingInfo.billing.subscription.status}",
    priceId: "${billingInfo.billing.subscription.priceId ?? 'null'}",
    currentPeriodEnd: "${
      billingInfo.billing.subscription.currentPeriodEnd ?? 'null'
    }"
  }`
      : 'null'
  },
  hasStripeCustomer: ${
    billingInfo.billing?.hasStripeCustomer ? 'true' : 'false'
  }
}`}
                    </pre>
                  </div>

                  {billingInfo.billing?.subscription
                    ?.currentPeriodEnd && (
                    <p className="text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">
                        Human view:
                      </span>{' '}
                      Current period ends{' '}
                      {new Date(
                        billingInfo.billing.subscription
                          .currentPeriodEnd
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      .
                    </p>
                  )}
                </div>
              )}
            </Panel>

            {/* C. MUTATION ZONE (Upgrade) */}
            <Panel
              title="Mutation Zone · Upgrade Flow"
              subtitle="This is how money changes state. Stripe Checkout + webhooks mutate the DB, then the engine updates what users can access."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Monthly */}
                <div className="relative flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-50">
                      PRO · Monthly
                    </h3>
                    <Tag tone="info">Stripe Checkout</Tag>
                  </div>
                  <p className="text-2xl font-semibold text-slate-50">
                    $29
                    <span className="text-xs font-normal text-slate-400">
                      /month
                    </span>
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-300">
                    <li>• Full PRO feature access</li>
                    <li>• Cancel anytime</li>
                    <li>• Perfect for trying the engine live</li>
                  </ul>
                  <button
                    onClick={() =>
                      initiateCheckout(PRICE_IDS.PRO_MONTHLY)
                    }
                    disabled={checkoutLoading}
                    className="mt-3 inline-flex items-center justify-center rounded-full border border-indigo-400/60 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/20 disabled:opacity-50"
                  >
                    {checkoutLoading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Opening checkout…</span>
                      </>
                    ) : (
                      'Start monthly checkout'
                    )}
                  </button>
                </div>

                {/* Yearly */}
                <div className="relative flex flex-col gap-3 rounded-2xl border border-emerald-500/70 bg-slate-950/70 p-4 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
                      Founder favorite
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-50">
                      PRO · Yearly
                    </h3>
                    <Tag tone="success">2 months free</Tag>
                  </div>
                  <p className="text-2xl font-semibold text-slate-50">
                    $290
                    <span className="text-xs font-normal text-slate-400">
                      /year
                    </span>
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-300">
                    <li>• Same enforcement, better price</li>
                    <li>• Ideal for long-running products</li>
                    <li>• One charge, full year of PRO access</li>
                  </ul>
                  <button
                    onClick={() =>
                      initiateCheckout(PRICE_IDS.PRO_YEARLY)
                    }
                    disabled={checkoutLoading}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {checkoutLoading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Opening checkout…</span>
                      </>
                    ) : (
                      'Start yearly checkout'
                    )}
                  </button>
                </div>
              </div>

              {checkoutError && (
                <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
                  <span className="font-semibold">Checkout error: </span>
                  {checkoutError}
                </p>
              )}

              {isProUser && hasActiveSubscription && (
                <p className="mt-3 text-[11px] text-emerald-300">
                  ✅ This session is already on PRO with an active
                  subscription. The engine will keep this in sync with
                  Stripe automatically.
                </p>
              )}
            </Panel>
          </div>

          {/* Right column: Gatekeeper + debug */}
          <div className="space-y-5">
            {/* B. GATEKEEPER TEST */}
            <Panel
              title="Gatekeeper · Protected Endpoint"
              subtitle="This endpoint represents a PRO-only feature. The engine decides whether the request passes or is blocked."
            >
              <button
                onClick={testProAccess}
                disabled={proAccessLoading}
                className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {proAccessLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Testing /api/protected/pro …</span>
                  </>
                ) : (
                  <>
                    <span>Run access check</span>
                    <span className="text-sm">🧪</span>
                  </>
                )}
              </button>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-[11px] text-slate-200">
                <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span>engine.request('/api/protected/pro')</span>
                  <span>
                    {proAccessResult
                      ? proAccessResult.status.toUpperCase()
                      : 'IDLE'}
                  </span>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre">
                  {proAccessResult ? (
                    proAccessResult.status === 'success' ? (
                      JSON.stringify(
                        {
                          ok: true,
                          message: proAccessResult.data.message,
                          user: proAccessResult.data.user,
                        },
                        null,
                        2,
                      )
                    ) : proAccessResult.status === 'forbidden' ? (
                      JSON.stringify(
                        {
                          ok: false,
                          error: proAccessResult.data.error,
                          code: proAccessResult.data.code,
                          currentPlan:
                            proAccessResult.data.currentPlan,
                          requiredPlans:
                            proAccessResult.data.requiredPlans,
                        },
                        null,
                        2,
                      )
                    ) : (
                      JSON.stringify(
                        {
                          ok: false,
                          error: proAccessResult.message,
                        },
                        null,
                        2,
                      )
                    )
                  ) : (
                    '// Waiting for request…\n// Press "Run access check" to hit the protected route.'
                  )}
                </pre>
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                In a real app, this check would sit behind your PRO
                dashboard, API routes, or feature flags. The important
                part: the decision is based on database truth, not what
                the browser <em>claims</em> the user has.
              </p>
            </Panel>

            {/* Debug footprint */}
            <Panel title="Telemetry · Demo Environment">
              <div className="grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
                <div className="space-y-1 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Environment
                  </p>
                  <p>
                    <span className="text-slate-500">API_URL: </span>
                    <span className="text-indigo-300 break-all">
                      {API_URL}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">NODE_ENV: </span>
                    <span className="text-slate-200">
                      {process.env.NODE_ENV || 'development'}
                    </span>
                  </p>
                </div>
                <div className="space-y-1 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Wiring
                  </p>
                  <p className="text-slate-300">
                    • GET <span className="text-indigo-300">/api/billing/me</span>
                  </p>
                  <p className="text-slate-300">
                    • POST{' '}
                    <span className="text-indigo-300">
                      /api/billing/checkout
                    </span>
                  </p>
                  <p className="text-slate-300">
                    • GET{' '}
                    <span className="text-indigo-300">
                      /api/protected/pro
                    </span>
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900/80 bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-[11px] text-slate-500">
          SaaS Engine Pro · Demo Control Plane · Next.js 14 · Stripe ·
          Prisma · PostgreSQL
        </div>
      </footer>
    </div>
  );
}


