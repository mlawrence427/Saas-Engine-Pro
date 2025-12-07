// ============================================================
// frontend/app/admin/page.tsx - SaaS Engine Pro
// Admin Dashboard
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AIDraft, AuditLog } from "@/lib/api";

// ============================================================
// TYPES
// ============================================================

interface DashboardStats {
  pendingDrafts: number;
  totalModules: number;
  totalUsers: number;
  recentActivity: number;
}

// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<AIDraft[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Fetch dashboard data
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [draftsRes, modulesRes, usersRes, auditRes, logsRes] = await Promise.all([
          api.admin.aiDrafts.list({ status: "PENDING", limit: 5 }),
          api.admin.modules.list(),
          api.admin.users.list({ limit: 1 }),
          api.admin.auditLogs.getStats(),
          api.admin.auditLogs.list({ limit: 5 }),
        ]);

        setStats({
          pendingDrafts: draftsRes.data?.pagination.total || 0,
          totalModules: modulesRes.data?.modules.length || 0,
          totalUsers: usersRes.data?.pagination.total || 0,
          recentActivity: auditRes.data?.last24Hours || 0,
        });

        setPendingDrafts(draftsRes.data?.drafts || []);
        setRecentLogs(logsRes.data?.logs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111111] rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Error State
  // ----------------------------------------------------------
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-gray-400 hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Dashboard
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Drafts"
          value={stats?.pendingDrafts || 0}
          icon="🤖"
          href="/admin/ai-drafts"
          highlight={stats?.pendingDrafts ? stats.pendingDrafts > 0 : false}
        />
        <StatCard
          label="Active Modules"
          value={stats?.totalModules || 0}
          icon="📦"
          href="/admin/modules"
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          href="/admin/users"
        />
        <StatCard
          label="Activity (24h)"
          value={stats?.recentActivity || 0}
          icon="📋"
          href="/admin/audit-logs"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Drafts */}
        <div className="bg-[#111111] rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>🤖</span>
              Pending AI Drafts
            </h2>
            <Link
              href="/admin/ai-drafts"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {pendingDrafts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No pending drafts to review
              </div>
            ) : (
              pendingDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={`/admin/ai-drafts/${draft.id}`}
                  className="block p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">
                        {draft.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {draft.description || "No description"}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full whitespace-nowrap">
                      {draft.targetModuleSlug ? "Update" : "New"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {formatRelativeTime(draft.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111111] rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>📋</span>
              Recent Activity
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No recent activity
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.performedByUser?.email || "System"} •{" "}
                        {formatRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111111] rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/ai-drafts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span>🤖</span>
            Review AI Drafts
          </Link>
          <Link
            href="/admin/modules/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span>➕</span>
            Create Module
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span>👥</span>
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD COMPONENT
// ============================================================

function StatCard({
  label,
  value,
  icon,
  href,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        bg-[#111111] rounded-xl p-6 border transition-colors
        ${highlight 
          ? "border-yellow-500/50 hover:border-yellow-500" 
          : "border-gray-800 hover:border-gray-700"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold mt-2 ${highlight ? "text-yellow-400" : "text-white"}`}>
        {value}
      </p>
    </Link>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    MODULE_CREATED: "📦",
    MODULE_ARCHIVED: "🗄️",
    MODULE_VERSION_CREATED: "🔄",
    MODULE_APPROVED: "✅",
    MODULE_REJECTED: "❌",
    PLAN_UPGRADED: "⬆️",
    PLAN_DOWNGRADED: "⬇️",
    ROLE_CHANGED: "👤",
    USER_CREATED: "➕",
    USER_DELETED: "🗑️",
    ACCESS_GRANTED: "🔓",
    ACCESS_REVOKED: "🔒",
  };
  return icons[action] || "📋";
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}