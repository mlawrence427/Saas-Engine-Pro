// ============================================================
// frontend/app/admin/modules/new/page.tsx - SaaS Engine Pro
// Create New Module Form
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, PlanTier } from "@/lib/api";

// ============================================================
// CONSTANTS
// ============================================================

const PLAN_OPTIONS: { value: PlanTier; label: string; description: string }[] = [
  { value: "FREE", label: "Free", description: "Available to all users" },
  { value: "PRO", label: "Pro", description: "Requires Pro subscription" },
  { value: "ENTERPRISE", label: "Enterprise", description: "Enterprise customers only" },
];

// ============================================================
// CREATE MODULE PAGE
// ============================================================

export default function CreateModulePage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [minPlan, setMinPlan] = useState<PlanTier>("FREE");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // ----------------------------------------------------------
  // Auto-generate slug from name
  // ----------------------------------------------------------
  const handleNameChange = (value: string) => {
    setName(value);

    if (!slugManuallyEdited) {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 64);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    // Only allow valid slug characters
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 64);
    setSlug(sanitized);
  };

  // ----------------------------------------------------------
  // Submit handler
  // ----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError("Module name is required");
      return;
    }

    if (!slug.trim()) {
      setError("Module slug is required");
      return;
    }

    if (slug.length < 2) {
      setError("Slug must be at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.admin.modules.create({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        minPlan,
      });

      if (res.success && res.data?.module) {
        router.push("/admin/modules");
      } else {
        throw new Error(res.message || "Failed to create module");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/modules"
        className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
      >
        ← Back to modules
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Create Module</h1>
        <p className="text-gray-400 mt-1">
          Manually create a new module in the registry
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          💡 <strong>Tip:</strong> For AI-generated modules, use the AI Drafts workflow instead.
          This form is for manual module creation by admins.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Module Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., User Management"
            className="w-full px-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Display name shown to users
          </p>
        </div>

        {/* Slug Field */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
            Slug <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              /modules/
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="user-management"
              className="w-full pl-24 pr-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            URL-safe identifier. Lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this module does..."
            rows={3}
            className="w-full px-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. Helps users understand the module&apos;s purpose.
          </p>
        </div>

        {/* Min Plan Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Minimum Plan <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {PLAN_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors
                  ${minPlan === option.value
                    ? "bg-blue-600/10 border-blue-500"
                    : "bg-[#111111] border-gray-800 hover:border-gray-700"
                  }
                `}
              >
                <input
                  type="radio"
                  name="minPlan"
                  value={option.value}
                  checked={minPlan === option.value}
                  onChange={(e) => setMinPlan(e.target.value as PlanTier)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-offset-0"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{option.label}</span>
                    <PlanBadge plan={option.value} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-3">Preview</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-medium text-white">{name || "Module Name"}</p>
              <p className="text-sm text-gray-500 font-mono">{slug || "module-slug"}</p>
            </div>
            <PlanBadge plan={minPlan} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-800">
          <Link
            href="/admin/modules"
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim() || !slug.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create Module"}
          </button>
        </div>
      </form>
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