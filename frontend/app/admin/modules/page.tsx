// ============================================================
// frontend/app/admin/modules/page.tsx - SaaS Engine Pro
// Admin Module Registry
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Module, PlanTier } from "@/lib/api";

// ============================================================
// CONSTANTS
// ============================================================

const PLAN_OPTIONS: { value: PlanTier | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Plans" },
  { value: "FREE", label: "Free" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

// ============================================================
// MODULES PAGE
// ============================================================

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<PlanTier | "ALL">("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Fetch modules
  // ----------------------------------------------------------
  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: { includeArchived?: boolean; minPlan?: PlanTier } = {};

      if (showArchived) {
        params.includeArchived = true;
      }

      if (planFilter !== "ALL") {
        params.minPlan = planFilter;
      }

      const res = await api.admin.modules.list(params);
      setModules(res.data?.modules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [planFilter, showArchived]);

  // ----------------------------------------------------------
  // Archive handler
  // ----------------------------------------------------------
  const handleArchive = async (module: Module) => {
    if (!confirm(`Archive "${module.name}" v${module.version}? This will hide it from users.`)) {
      return;
    }

    try {
      setArchiving(module.id);
      await api.admin.modules.archive(module.id);
      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive module");
    } finally {
      setArchiving(null);
    }
  };

  // ----------------------------------------------------------
  // Group modules by slug (for version display)
  // ----------------------------------------------------------
  const groupedModules = modules.reduce<Record<string, Module[]>>((acc, mod) => {
    if (!acc[mod.slug]) {
      acc[mod.slug] = [];
    }
    acc[mod.slug].push(mod);
    return acc;
  }, {});

  // Sort each group by version descending
  Object.keys(groupedModules).forEach((slug) => {
    groupedModules[slug].sort((a, b) => b.version - a.version);
  });

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Module Registry</h1>
          <p className="text-gray-400 mt-1">
            Manage all modules in the system
          </p>
        </div>
        <Link
          href="/admin/modules/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium transition-colors"
        >
          + Create Module
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Plan Filter */}
        <div className="flex items-center gap-2">
          {PLAN_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPlanFilter(option.value)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${planFilter === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Show Archived Toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
          />
          Show archived
        </label>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111111] rounded-xl p-6 animate-pulse border border-gray-800">
              <div className="h-5 bg-gray-800 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-800 rounded w-16"></div>
                <div className="h-6 bg-gray-800 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedModules).length === 0 ? (
        /* Empty State */
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-12 text-center">
          <span className="text-4xl mb-4 block">📦</span>
          <p className="text-gray-400 mb-4">No modules found</p>
          <Link
            href="/admin/modules/new"
            className="text-blue-400 hover:text-blue-300"
          >
            Create your first module →
          </Link>
        </div>
      ) : (
        /* Modules List */
        <div className="space-y-4">
          {Object.entries(groupedModules).map(([slug, versions]) => {
            const latest = versions[0];
            const hasMultipleVersions = versions.length > 1;
            const activeVersion = versions.find((v) => !v.isArchived);

            return (
              <div
                key={slug}
                className={`bg-[#111111] rounded-xl border transition-colors ${
                  latest.isArchived && !showArchived
                    ? "border-gray-800 opacity-60"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                {/* Main Module Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {latest.name}
                        </h3>
                        <PlanBadge plan={latest.minPlan} />
                        {activeVersion ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            v{activeVersion.version} active
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">
                            Archived
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-3">
                        {latest.description || "No description"}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="font-mono bg-gray-800 px-2 py-1 rounded">
                          {slug}
                        </span>
                        {hasMultipleVersions && (
                          <span>{versions.length} versions</span>
                        )}
                        {latest.publishedByUser && (
                          <span>
                            Published by {latest.publishedByUser.email}
                          </span>
                        )}
                        {latest.sourceAIDraft && (
                          <span className="text-purple-400">
                            🤖 AI Generated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/modules/${slug}/history`}
                        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        History
                      </Link>
                      {activeVersion && (
                        <button
                          onClick={() => handleArchive(activeVersion)}
                          disabled={archiving === activeVersion.id}
                          className="px-3 py-1.5 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {archiving === activeVersion.id ? "..." : "Archive"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Version History Preview (if multiple versions and showing archived) */}
                {showArchived && hasMultipleVersions && (
                  <div className="border-t border-gray-800 p-4 bg-gray-900/50">
                    <p className="text-xs text-gray-500 mb-2">Version History</p>
                    <div className="flex flex-wrap gap-2">
                      {versions.map((v) => (
                        <span
                          key={v.id}
                          className={`text-xs px-2 py-1 rounded ${
                            v.isArchived
                              ? "bg-gray-800 text-gray-500"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          v{v.version} {v.isArchived ? "(archived)" : "(active)"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && modules.length > 0 && (
        <div className="text-sm text-gray-500 pt-4 border-t border-gray-800">
          {Object.keys(groupedModules).length} module{Object.keys(groupedModules).length !== 1 ? "s" : ""} •{" "}
          {modules.filter((m) => !m.isArchived).length} active •{" "}
          {modules.filter((m) => m.isArchived).length} archived
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function PlanBadge({ plan }: { plan: PlanTier }) {
  const styles = {
    FREE: "bg-gray-500/20 text-gray-400",
    PRO: "bg-blue-500/20 text-blue-400",
    ENTERPRISE: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[plan]}`}>
      {plan}
    </span>
  );
}