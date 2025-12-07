// ============================================================
// frontend/app/admin/audit-logs/page.tsx - SaaS Engine Pro
// Audit Logs Viewer
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, AuditLog, AuditAction, AuditEntityType } from "@/lib/api";

// ============================================================
// CONSTANTS
// ============================================================

const ACTION_OPTIONS: { value: AuditAction | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Actions" },
  { value: "MODULE_CREATED", label: "Module Created" },
  { value: "MODULE_APPROVED", label: "Module Approved" },
  { value: "MODULE_REJECTED", label: "Module Rejected" },
  { value: "MODULE_ARCHIVED", label: "Module Archived" },
  { value: "MODULE_VERSION_CREATED", label: "Version Created" },
  { value: "PLAN_UPGRADED", label: "Plan Upgraded" },
  { value: "PLAN_DOWNGRADED", label: "Plan Downgraded" },
  { value: "ROLE_CHANGED", label: "Role Changed" },
  { value: "USER_CREATED", label: "User Created" },
];

const ENTITY_OPTIONS: { value: AuditEntityType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Entities" },
  { value: "MODULE", label: "Modules" },
  { value: "AIDRAFT", label: "AI Drafts" },
  { value: "USER", label: "Users" },
  { value: "SUBSCRIPTION", label: "Subscriptions" },
];

const PAGE_SIZE = 20;

// ============================================================
// AUDIT LOGS PAGE
// ============================================================

export default function AuditLogsPage() {
  const searchParams = useSearchParams();

  // Get initial filters from URL
  const initialEntityType = searchParams.get("entityType") as AuditEntityType | null;
  const initialEntityId = searchParams.get("entityId");

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, offset: 0 });

  // Filters
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | "ALL">(
    initialEntityType || "ALL"
  );
  const [entityIdFilter, setEntityIdFilter] = useState(initialEntityId || "");
  const [showFilters, setShowFilters] = useState(!!initialEntityType || !!initialEntityId);

  // Stats
  const [stats, setStats] = useState<{
    totalLogs: number;
    last24Hours: number;
    last7Days: number;
  } | null>(null);

  // ----------------------------------------------------------
  // Fetch logs
  // ----------------------------------------------------------
  const fetchLogs = async (offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        action?: AuditAction;
        entityType?: AuditEntityType;
        entityId?: string;
        limit: number;
        offset: number;
      } = {
        limit: PAGE_SIZE,
        offset,
      };

      if (actionFilter !== "ALL") {
        params.action = actionFilter;
      }

      if (entityTypeFilter !== "ALL") {
        params.entityType = entityTypeFilter;
      }

      if (entityIdFilter.trim()) {
        params.entityId = entityIdFilter.trim();
      }

      const res = await api.admin.auditLogs.list(params);

      setLogs(res.data?.logs || []);
      setPagination({
        total: res.data?.pagination.total || 0,
        offset,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await api.admin.auditLogs.getStats();
      if (res.data) {
        setStats({
          totalLogs: res.data.totalLogs,
          last24Hours: res.data.last24Hours,
          last7Days: res.data.last7Days,
        });
      }
    } catch {
      // Stats are optional, don't show error
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs(0);
    fetchStats();
  }, [actionFilter, entityTypeFilter, entityIdFilter]);

  // ----------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------
  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - PAGE_SIZE);
    fetchLogs(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + PAGE_SIZE;
    if (newOffset < pagination.total) {
      fetchLogs(newOffset);
    }
  };

  const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);

  // ----------------------------------------------------------
  // Clear filters
  // ----------------------------------------------------------
  const clearFilters = () => {
    setActionFilter("ALL");
    setEntityTypeFilter("ALL");
    setEntityIdFilter("");
  };

  const hasActiveFilters =
    actionFilter !== "ALL" || entityTypeFilter !== "ALL" || entityIdFilter.trim() !== "";

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">
            Complete governance trail for all system actions
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{stats.last24Hours}</p>
              <p className="text-gray-500">Last 24h</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{stats.last7Days}</p>
              <p className="text-gray-500">Last 7 days</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{stats.totalLogs}</p>
              <p className="text-gray-500">Total</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
        >
          <span>{showFilters ? "▼" : "▶"}</span>
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as AuditAction | "ALL")}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value as AuditEntityType | "ALL")}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity ID Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Entity ID</label>
              <input
                type="text"
                value={entityIdFilter}
                onChange={(e) => setEntityIdFilter(e.target.value)}
                placeholder="Filter by entity ID..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#111111] rounded-lg p-4 animate-pulse border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        /* Empty State */
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-12 text-center">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="text-gray-400">
            {hasActiveFilters ? "No logs match your filters" : "No audit logs yet"}
          </p>
        </div>
      ) : (
        /* Logs List */
        <div className="bg-[#111111] rounded-xl border border-gray-800 divide-y divide-gray-800">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Showing {pagination.offset + 1}–{Math.min(pagination.offset + PAGE_SIZE, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pagination.offset + PAGE_SIZE >= pagination.total}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LOG ENTRY COMPONENT
// ============================================================

function LogEntry({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4">
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
          {getActionIcon(log.action)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">
              {formatAction(log.action)}
            </span>
            <ActionBadge action={log.action} />
            <EntityBadge entityType={log.entityType} />
          </div>

          <p className="text-sm text-gray-500 mt-1">
            {log.performedByUser?.email || "System"} •{" "}
            {formatDate(log.createdAt)}
          </p>
        </div>

        {/* Expand Icon */}
        <div className="text-gray-500 flex-shrink-0">
          {expanded ? "▼" : "▶"}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 ml-14 space-y-3">
          {/* Entity Info */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Entity:</span>
            <span className="font-mono text-gray-300 bg-gray-800 px-2 py-1 rounded">
              {log.entityType}/{log.entityId}
            </span>
            <Link
              href={getEntityLink(log.entityType, log.entityId)}
              className="text-blue-400 hover:text-blue-300"
            >
              View →
            </Link>
          </div>

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Metadata:</p>
              <pre className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-600">
            ID: {log.id} • {new Date(log.createdAt).toISOString()}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BADGE COMPONENTS
// ============================================================

function ActionBadge({ action }: { action: AuditAction }) {
  const colors: Record<string, string> = {
    MODULE_CREATED: "bg-green-500/20 text-green-400",
    MODULE_APPROVED: "bg-green-500/20 text-green-400",
    MODULE_REJECTED: "bg-red-500/20 text-red-400",
    MODULE_ARCHIVED: "bg-gray-500/20 text-gray-400",
    MODULE_VERSION_CREATED: "bg-blue-500/20 text-blue-400",
    PLAN_UPGRADED: "bg-purple-500/20 text-purple-400",
    PLAN_DOWNGRADED: "bg-yellow-500/20 text-yellow-400",
    ROLE_CHANGED: "bg-orange-500/20 text-orange-400",
    USER_CREATED: "bg-green-500/20 text-green-400",
    USER_DELETED: "bg-red-500/20 text-red-400",
    ACCESS_GRANTED: "bg-green-500/20 text-green-400",
    ACCESS_REVOKED: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[action] || "bg-gray-500/20 text-gray-400"}`}>
      {action.replace(/_/g, " ")}
    </span>
  );
}

function EntityBadge({ entityType }: { entityType: AuditEntityType }) {
  const colors: Record<AuditEntityType, string> = {
    MODULE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    AIDRAFT: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    USER: "bg-green-500/10 text-green-400 border-green-500/20",
    SUBSCRIPTION: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${colors[entityType]}`}>
      {entityType}
    </span>
  );
}

// ============================================================
// HELPERS
// ============================================================

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

function formatDate(dateString: string): string {
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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEntityLink(entityType: AuditEntityType, entityId: string): string {
  switch (entityType) {
    case "MODULE":
      return `/admin/modules?id=${entityId}`;
    case "AIDRAFT":
      return `/admin/ai-drafts/${entityId}`;
    case "USER":
      return `/admin/users?id=${entityId}`;
    case "SUBSCRIPTION":
      return `/admin/users`;
    default:
      return "#";
  }
}