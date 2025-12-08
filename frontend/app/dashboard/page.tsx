// ============================================================
// frontend/app/dashboard/page.tsx - SaaS Engine Pro
// Authenticated User Dashboard
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, ModuleWithAccess } from "@/lib/api";

// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [modules, setModules] = useState<ModuleWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Fetch user's accessible modules
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const res = await api.modules.list();
        // Filter to only show accessible modules
        const accessible = (res.data?.modules || []).filter((m) => m.hasAccess);
        setModules(accessible);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load modules");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchModules();
    }
  }, [authLoading, user]);

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-white">SaaS Engine</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-white font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/modules"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Modules
            </Link>
            <Link
              href="/account"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Account
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your SaaS Engine
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Your Plan"
            value={user?.plan || 'FREE'}
            icon="💎"
            href="/account/billing"
          />
          <StatCard
            label="Available Modules"
            value={modules.length.toString()}
            icon="📦"
            href="/modules"
          />
          <StatCard
            label="Your Role"
            value={user?.role || 'USER'}
            icon="👤"
            href="/account"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* Active Modules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Your Modules</h2>
            <Link
              href="/modules"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#111111] rounded-xl p-6 animate-pulse border border-gray-800"
                >
                  <div className="h-5 bg-gray-800 rounded w-2/3 mb-3"></div>
                  <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-[#111111] rounded-xl border border-gray-800 p-8 text-center">
              <span className="text-4xl mb-4 block">📦</span>
              <p className="text-gray-400 mb-4">No modules available yet</p>
              <Link
                href="/modules"
                className="text-blue-400 hover:text-blue-300"
              >
                Browse all modules →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.slice(0, 6).map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/modules"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span>📦</span>
              Browse Modules
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span>👤</span>
              Account Settings
            </Link>
            <Link
              href="/account/billing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span>💳</span>
              Manage Billing
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <span>⚙️</span>
                Admin Console
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[#111111] rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </Link>
  );
}

function ModuleCard({ module }: { module: ModuleWithAccess }) {
  return (
    <Link
      href={`/modules/${module.slug}`}
      className="bg-[#111111] rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-white">{module.name}</h3>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
          Active
        </span>
      </div>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {module.description || "No description"}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-mono bg-gray-800 px-2 py-1 rounded">{module.slug}</span>
        <span>v{module.version}</span>
      </div>
    </Link>
  );
}