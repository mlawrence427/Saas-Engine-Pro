// ============================================================
// frontend/app/(public)/modules/page.tsx - SaaS Engine Pro
// Public Modules Listing with Plan Gating
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, ModuleWithAccess, PlanTier } from "@/lib/api";

// ============================================================
// MODULES PAGE
// ============================================================

export default function ModulesPage() {
  const { user, isAuthenticated, loading: authLoading, hasMinPlan } = useAuth();

  const [modules, setModules] = useState<ModuleWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "locked">("all");

  // ----------------------------------------------------------
  // Fetch modules
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchModules = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await api.modules.list();
        setModules(res.data?.modules || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load modules");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchModules();
    }
  }, [isAuthenticated, authLoading]);

  // ----------------------------------------------------------
  // Filter modules
  // ----------------------------------------------------------
  const filteredModules = modules.filter((mod) => {
    if (filter === "available") return mod.hasAccess;
    if (filter === "locked") return !mod.hasAccess;
    return true;
  });

  const availableCount = modules.filter((m) => m.hasAccess).length;
  const lockedCount = modules.filter((m) => !m.hasAccess).length;

  // ----------------------------------------------------------
  // Not authenticated
  // ----------------------------------------------------------
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <span className="text-6xl mb-6 block">📦</span>
          <h1 className="text-2xl font-bold text-white mb-3">
            Discover Modules
          </h1>
          <p className="text-gray-400 mb-6">
            Sign in to explore available modules and unlock powerful features for your SaaS.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
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
          <div className="flex items-center gap-4">
            <PlanBadge plan={user?.plan || "FREE"} />
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Modules</h1>
          <p className="text-gray-400">
            Extend your SaaS with powerful, AI-generated modules
          </p>
        </div>

        {/* Stats & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All ({modules.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "available"
                  ? "bg-green-600/20 text-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setFilter("locked")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "locked"
                  ? "bg-yellow-600/20 text-yellow-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Locked ({lockedCount})
            </button>
          </div>

          {/* Upgrade CTA */}
          {user?.plan !== "ENTERPRISE" && lockedCount > 0 && (
            <Link
              href="/settings/billing"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Upgrade to unlock {lockedCount} more →
            </Link>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading || authLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#111111] rounded-xl p-6 animate-pulse border border-gray-800"
              >
                <div className="h-6 bg-gray-800 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-800 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          /* Empty State */
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-12 text-center">
            <span className="text-4xl mb-4 block">
              {filter === "available" ? "✅" : filter === "locked" ? "🔒" : "📦"}
            </span>
            <p className="text-gray-400">
              {filter === "available"
                ? "No modules available with your current plan"
                : filter === "locked"
                ? "All modules are available to you!"
                : "No modules available yet"}
            </p>
            {filter === "available" && user?.plan !== "ENTERPRISE" && (
              <Link
                href="/settings/billing"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300"
              >
                Upgrade your plan →
              </Link>
            )}
          </div>
        ) : (
          /* Modules Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((module) => (
              <ModuleCard key={module.id} module={module} userPlan={user?.plan || "FREE"} />
            ))}
          </div>
        )}

        {/* Plan Comparison */}
        {user?.plan === "FREE" && (
          <div className="mt-12 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl border border-blue-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-2">
              Unlock More Modules
            </h2>
            <p className="text-gray-400 mb-4">
              Upgrade your plan to access Pro and Enterprise modules.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a]/50 rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Free</p>
                <p className="text-white font-bold text-lg">Basic Modules</p>
                <p className="text-gray-500 text-sm mt-2">Current plan</p>
              </div>
              <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-400 text-sm mb-1">Pro</p>
                <p className="text-white font-bold text-lg">+ Analytics</p>
                <Link
                  href="/settings/billing"
                  className="text-blue-400 text-sm mt-2 inline-block hover:text-blue-300"
                >
                  Upgrade →
                </Link>
              </div>
              <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-purple-500/30">
                <p className="text-purple-400 text-sm mb-1">Enterprise</p>
                <p className="text-white font-bold text-lg">+ AI Features</p>
                <Link
                  href="/settings/billing"
                  className="text-purple-400 text-sm mt-2 inline-block hover:text-purple-300"
                >
                  Upgrade →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// MODULE CARD COMPONENT
// ============================================================

function ModuleCard({
  module,
  userPlan,
}: {
  module: ModuleWithAccess;
  userPlan: PlanTier;
}) {
  const isLocked = !module.hasAccess;

  return (
    <div
      className={`bg-[#111111] rounded-xl border p-6 transition-all ${
        isLocked
          ? "border-gray-800 opacity-75"
          : "border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-white">{module.name}</h3>
        <MinPlanBadge minPlan={module.minPlan} userPlan={userPlan} />
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {module.description || "No description available"}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <span className="font-mono bg-gray-800 px-2 py-1 rounded">
          {module.slug}
        </span>
        <span>v{module.version}</span>
      </div>

      {/* Action */}
      {isLocked ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-yellow-500 flex items-center gap-1">
            <span>🔒</span> Requires {module.minPlan}
          </span>
          <Link
            href="/settings/billing"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Upgrade
          </Link>
        </div>
      ) : (
        <Link
          href={`/modules/${module.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
        >
          Open Module
          <span>→</span>
        </Link>
      )}
    </div>
  );
}

// ============================================================
// BADGE COMPONENTS
// ============================================================

function PlanBadge({ plan }: { plan: PlanTier }) {
  const styles: Record<PlanTier, string> = {
    FREE: "bg-gray-500/20 text-gray-400",
    PRO: "bg-blue-500/20 text-blue-400",
    ENTERPRISE: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[plan]}`}>
      {plan}
    </span>
  );
}

function MinPlanBadge({
  minPlan,
  userPlan,
}: {
  minPlan: PlanTier;
  userPlan: PlanTier;
}) {
  const planLevels: Record<PlanTier, number> = {
    FREE: 0,
    PRO: 1,
    ENTERPRISE: 2,
  };

  const hasAccess = planLevels[userPlan] >= planLevels[minPlan];

  if (minPlan === "FREE") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
        Free
      </span>
    );
  }

  const styles: Record<PlanTier, string> = {
    FREE: "bg-green-500/20 text-green-400",
    PRO: hasAccess ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400",
    ENTERPRISE: hasAccess ? "bg-purple-500/20 text-purple-400" : "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[minPlan]}`}>
      {hasAccess ? minPlan : `🔒 ${minPlan}`}
    </span>
  );
}