// ============================================================
// frontend/app/admin/modules/[slug]/history/page.tsx - SaaS Engine Pro
// Module Version History
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Module, PlanTier } from "@/lib/api";

// ============================================================
// TYPES
// ============================================================

interface PageProps {
  params: { slug: string };
}

interface HistoryData {
  slug: string;
  versions: Module[];
  totalVersions: number;
  currentVersion: number | null;
}

// ============================================================
// HISTORY PAGE
// ============================================================

export default function ModuleHistoryPage({ params }: PageProps) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Fetch history
  // ----------------------------------------------------------
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.admin.modules.getHistory(params.slug);

      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || "Failed to load history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [params.slug]);

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
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive module");
    } finally {
      setArchiving(null);
    }
  };

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-gray-800 rounded w-32 animate-pulse"></div>
        <div className="h-8 bg-gray-800 rounded w-64 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111111] rounded-xl p-6 animate-pulse border border-gray-800">
              <div className="h-5 bg-gray-800 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Error State
  // ----------------------------------------------------------
  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/modules"
          className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
        >
          ← Back to modules
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error || "Module not found"}</p>
        </div>
      </div>
    );
  }

  const activeVersion = data.versions.find((v) => !v.isArchived);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/modules"
        className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
      >
        ← Back to modules
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">
              {data.versions[0]?.name || data.slug}
            </h1>
            {activeVersion ? (
              <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                v{activeVersion.version} active
              </span>
            ) : (
              <span className="text-sm bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full">
                All versions archived
              </span>
            )}
          </div>
          <p className="text-gray-400 font-mono">{data.slug}</p>
        </div>

        {/* Stats */}
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{data.totalVersions}</p>
          <p className="text-sm text-gray-500">
            version{data.totalVersions !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-800"></div>

        {/* Versions */}
        <div className="space-y-4">
          {data.versions.map((version, index) => (
            <VersionCard
              key={version.id}
              version={version}
              isLatest={index === 0}
              isActive={!version.isArchived}
              onArchive={() => handleArchive(version)}
              archiving={archiving === version.id}
            />
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-[#111111] rounded-xl border border-gray-800 p-6 mt-8">
        <h3 className="font-semibold text-white mb-4">About Module Versioning</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>Only one version can be <strong className="text-white">active</strong> at a time</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400">•</span>
            <span>When an AI draft updates a module, the previous version is automatically <strong className="text-white">archived</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-500">•</span>
            <span>Archived versions are kept for <strong className="text-white">audit trail</strong> purposes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Users only see the <strong className="text-white">active version</strong> of each module</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// VERSION CARD COMPONENT
// ============================================================

function VersionCard({
  version,
  isLatest,
  isActive,
  onArchive,
  archiving,
}: {
  version: Module;
  isLatest: boolean;
  isActive: boolean;
  onArchive: () => void;
  archiving: boolean;
}) {
  return (
    <div className="relative pl-16">
      {/* Timeline dot */}
      <div
        className={`absolute left-4 w-5 h-5 rounded-full border-4 ${
          isActive
            ? "bg-green-500 border-green-500/30"
            : "bg-gray-700 border-gray-800"
        }`}
      ></div>

      {/* Card */}
      <div
        className={`bg-[#111111] rounded-xl border p-5 ${
          isActive ? "border-green-500/30" : "border-gray-800"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold text-white">
                Version {version.version}
              </span>
              {isLatest && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                  Latest
                </span>
              )}
              {isActive ? (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Active
                </span>
              ) : (
                <span className="text-xs bg-gray-500/20 text-gray-500 px-2 py-0.5 rounded-full">
                  Archived
                </span>
              )}
              <PlanBadge plan={version.minPlan} />
            </div>

            <p className="text-gray-400 text-sm mb-3">
              {version.description || "No description"}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {version.publishedAt && (
                <span>
                  Published {formatDate(version.publishedAt)}
                </span>
              )}
              {version.publishedByUser && (
                <span>
                  by {version.publishedByUser.email}
                </span>
              )}
              {version.sourceAIDraft && (
                <span className="text-purple-400">
                  🤖 From AI Draft: {version.sourceAIDraft.title}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* View Audit Log */}
            <Link
              href={`/admin/audit-logs?entityType=MODULE&entityId=${version.id}`}
              className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Audit Log
            </Link>

            {/* Archive Button */}
            {isActive && (
              <button
                onClick={onArchive}
                disabled={archiving}
                className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {archiving ? "..." : "Archive"}
              </button>
            )}
          </div>
        </div>
      </div>
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

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}