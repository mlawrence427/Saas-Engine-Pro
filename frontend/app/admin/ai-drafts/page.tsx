// ============================================================
// frontend/app/admin/ai-drafts/page.tsx - SaaS Engine Pro
// AI Drafts List with Filtering
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AIDraft, AIDraftStatus } from "@/lib/api";

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_OPTIONS: { value: AIDraftStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Drafts" },
  { value: "PENDING", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const PAGE_SIZE = 10;

// ============================================================
// AI DRAFTS PAGE
// ============================================================

export default function AIDraftsPage() {
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AIDraftStatus | "ALL">("PENDING");
  const [pagination, setPagination] = useState({ total: 0, offset: 0 });

  // ----------------------------------------------------------
  // Fetch drafts
  // ----------------------------------------------------------
  const fetchDrafts = async (status: AIDraftStatus | "ALL", offset: number) => {
    try {
      setLoading(true);
      setError(null);

      const params: { status?: AIDraftStatus; limit: number; offset: number } = {
        limit: PAGE_SIZE,
        offset,
      };

      if (status !== "ALL") {
        params.status = status;
      }

      const res = await api.admin.aiDrafts.list(params);

      setDrafts(res.data?.drafts || []);
      setPagination({
        total: res.data?.pagination.total || 0,
        offset,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  // Initial load & filter changes
  useEffect(() => {
    fetchDrafts(statusFilter, 0);
  }, [statusFilter]);

  // ----------------------------------------------------------
  // Pagination handlers
  // ----------------------------------------------------------
  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - PAGE_SIZE);
    fetchDrafts(statusFilter, newOffset);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + PAGE_SIZE;
    if (newOffset < pagination.total) {
      fetchDrafts(statusFilter, newOffset);
    }
  };

  const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Module Drafts</h1>
          <p className="text-gray-400 mt-1">
            Review and approve AI-generated module proposals
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${statusFilter === option.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }
            `}
          >
            {option.label}
            {option.value === "PENDING" && pagination.total > 0 && statusFilter === "PENDING" && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pagination.total}
              </span>
            )}
          </button>
        ))}
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
              <div className="h-5 bg-gray-800 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-800 rounded w-20"></div>
                <div className="h-6 bg-gray-800 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : drafts.length === 0 ? (
        /* Empty State */
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-12 text-center">
          <span className="text-4xl mb-4 block">
            {statusFilter === "PENDING" ? "✅" : "📭"}
          </span>
          <p className="text-gray-400">
            {statusFilter === "PENDING"
              ? "No drafts pending review"
              : statusFilter === "ALL"
              ? "No AI drafts yet"
              : `No ${statusFilter.toLowerCase()} drafts`}
          </p>
        </div>
      ) : (
        /* Drafts List */
        <div className="space-y-4">
          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
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
// DRAFT CARD COMPONENT
// ============================================================

function DraftCard({ draft }: { draft: AIDraft }) {
  const statusStyles = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    APPROVED: "bg-green-500/20 text-green-400",
    REJECTED: "bg-red-500/20 text-red-400",
  };

  return (
    <Link
      href={`/admin/ai-drafts/${draft.id}`}
      className="block bg-[#111111] rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {draft.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[draft.status]}`}>
              {draft.status}
            </span>
          </div>

          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
            {draft.description || "No description provided"}
          </p>

          {/* Meta Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Badge */}
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
              {draft.targetModuleSlug ? `Update: ${draft.targetModuleSlug}` : "New Module"}
            </span>

            {/* Min Plan from Preview */}
            {draft.permissionsPreview && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                {(draft.permissionsPreview as { minPlan?: string }).minPlan || "FREE"}
              </span>
            )}

            {/* Schema Preview Indicator */}
            {draft.schemaPreview && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                Has Schema
              </span>
            )}

            {/* Routes Preview Indicator */}
            {draft.routesPreview && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                Has Routes
              </span>
            )}
          </div>
        </div>

        {/* Right: Arrow */}
        <div className="text-gray-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>
          Created by {draft.createdByUser?.email || "Unknown"} •{" "}
          {formatDate(draft.createdAt)}
        </span>
        {draft.status !== "PENDING" && draft.reviewedAt && (
          <span>
            Reviewed {formatDate(draft.reviewedAt)}
          </span>
        )}
      </div>
    </Link>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}