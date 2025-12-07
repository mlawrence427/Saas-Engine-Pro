// ============================================================
// frontend/app/admin/ai-drafts/[id]/page.tsx - SaaS Engine Pro
// AI Draft Detail with Approve/Reject Actions
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, AIDraft } from "@/lib/api";

// ============================================================
// TYPES
// ============================================================

interface PageProps {
  params: { id: string };
}

// ============================================================
// DRAFT DETAIL PAGE
// ============================================================

export default function AIDraftDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<AIDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  // ----------------------------------------------------------
  // Fetch draft
  // ----------------------------------------------------------
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.admin.aiDrafts.get(params.id);
        setDraft(res.data?.draft || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load draft");
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [params.id]);

  // ----------------------------------------------------------
  // Approve handler
  // ----------------------------------------------------------
  const handleApprove = async () => {
    if (!draft) return;

    try {
      setActionLoading(true);
      const res = await api.admin.aiDrafts.approve(draft.id, reviewNote || undefined);

      // Show success and redirect
      alert(
        res.data?.isNewModule
          ? `Module "${res.data.module.name}" created successfully!`
          : `Module "${res.data?.module.name}" updated to version ${res.data?.module.version}!`
      );

      router.push("/admin/ai-drafts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve draft");
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
    }
  };

  // ----------------------------------------------------------
  // Reject handler
  // ----------------------------------------------------------
  const handleReject = async () => {
    if (!draft || !reviewNote.trim()) return;

    try {
      setActionLoading(true);
      await api.admin.aiDrafts.reject(draft.id, reviewNote);

      alert(`Draft "${draft.title}" has been rejected`);
      router.push("/admin/ai-drafts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject draft");
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-800 rounded w-48 animate-pulse"></div>
        <div className="bg-[#111111] rounded-xl p-6 animate-pulse border border-gray-800">
          <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Error State
  // ----------------------------------------------------------
  if (error || !draft) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-drafts"
          className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
        >
          ← Back to drafts
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error || "Draft not found"}</p>
        </div>
      </div>
    );
  }

  const isPending = draft.status === "PENDING";

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/ai-drafts"
        className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
      >
        ← Back to drafts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{draft.title}</h1>
            <StatusBadge status={draft.status} />
          </div>
          <p className="text-gray-400 mt-2">{draft.description || "No description"}</p>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg font-medium transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-500 rounded-lg font-medium transition-colors"
            >
              Approve & Publish
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Meta Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          label="Type"
          value={draft.targetModuleSlug ? "Module Update" : "New Module"}
          subvalue={draft.targetModuleSlug ? `Target: ${draft.targetModuleSlug}` : undefined}
        />
        <InfoCard
          label="Created By"
          value={draft.createdByUser?.email || "Unknown"}
          subvalue={formatDate(draft.createdAt)}
        />
        <InfoCard
          label="Min Plan"
          value={(draft.permissionsPreview as { minPlan?: string })?.minPlan || "FREE"}
        />
      </div>

      {/* Review Info (if not pending) */}
      {!isPending && draft.reviewedAt && (
        <div className={`rounded-xl p-4 border ${
          draft.status === "APPROVED" 
            ? "bg-green-500/10 border-green-500/20" 
            : "bg-red-500/10 border-red-500/20"
        }`}>
          <p className={`font-medium ${draft.status === "APPROVED" ? "text-green-400" : "text-red-400"}`}>
            {draft.status === "APPROVED" ? "✅ Approved" : "❌ Rejected"} on {formatDate(draft.reviewedAt)}
          </p>
          {draft.reviewNote && (
            <p className="text-gray-400 mt-2 text-sm">Note: {draft.reviewNote}</p>
          )}
          {draft.resultingModules && draft.resultingModules.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">Resulting modules:</p>
              <div className="flex flex-wrap gap-2">
                {draft.resultingModules.map((mod) => (
                  <Link
                    key={mod.id}
                    href={`/admin/modules?slug=${mod.slug}`}
                    className="text-sm bg-gray-800 text-gray-300 px-2 py-1 rounded hover:bg-gray-700"
                  >
                    {mod.slug} v{mod.version}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schema Preview */}
        <PreviewPanel
          title="Schema Preview"
          icon="🗄️"
          data={draft.schemaPreview}
          emptyText="No schema preview available"
        />

        {/* Routes Preview */}
        <PreviewPanel
          title="Routes Preview"
          icon="🛣️"
          data={draft.routesPreview}
          emptyText="No routes preview available"
        />
      </div>

      {/* Permissions Preview */}
      <PreviewPanel
        title="Permissions Preview"
        icon="🔐"
        data={draft.permissionsPreview}
        emptyText="No permissions preview available"
      />

      {/* Approve Modal */}
      {showApproveModal && (
        <Modal
          title="Approve Draft"
          onClose={() => setShowApproveModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              {draft.targetModuleSlug
                ? `This will create a new version of "${draft.targetModuleSlug}" and archive the current version.`
                : `This will create a new module "${draft.title}".`}
            </p>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Review Note (optional)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? "Publishing..." : "Approve & Publish"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          title="Reject Draft"
          onClose={() => setShowRejectModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              Please provide a reason for rejecting this draft. This will be recorded in the audit log.
            </p>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Explain why this draft is being rejected..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !reviewNote.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? "Rejecting..." : "Reject Draft"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function StatusBadge({ status }: { status: AIDraft["status"] }) {
  const styles = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    APPROVED: "bg-green-500/20 text-green-400",
    REJECTED: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`text-sm px-3 py-1 rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

function InfoCard({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="bg-[#111111] rounded-xl border border-gray-800 p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-white font-medium">{value}</p>
      {subvalue && <p className="text-sm text-gray-500 mt-1">{subvalue}</p>}
    </div>
  );
}

function PreviewPanel({
  title,
  icon,
  data,
  emptyText,
}: {
  title: string;
  icon: string;
  data: Record<string, unknown> | null;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#111111] rounded-xl border border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
        <span className="text-gray-500">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="p-4 pt-0">
          {data ? (
            <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500 text-sm">{emptyText}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111111] border border-gray-800 rounded-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
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