// frontend/src/app/dashboard/page.tsx
"use client";

import AuthGuard from "../../components/AuthGuard";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">SaaS Engine Pro</h1>
              <p className="text-slate-400 mt-1">
                Welcome back, {user?.name || user?.email}.
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl px-4 py-2 text-sm border border-slate-700 hover:bg-slate-800"
            >
              Log out
            </button>
          </header>

          {/* Account card */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-medium mb-2">Your account</h2>
              <dl className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-4">
                  <dt>Email</dt>
                  <dd className="font-mono text-slate-100 break-all">
                    {user?.email}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Name</dt>
                  <dd>
                    {user?.name ?? (
                      <span className="text-slate-500">Not set</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>User ID</dt>
                  <dd className="font-mono text-xs text-slate-500 break-all">
                    {user?.id}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Placeholder for Stripe stuff */}
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-medium mb-2">Subscription</h2>
              <p className="text-sm text-slate-400">
                This is where we&apos;ll show the user&apos;s Stripe plan,
                status, renewal date, and a “Manage billing” button once we
                wire up Stripe. For now it&apos;s just a placeholder.
              </p>
            </div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
