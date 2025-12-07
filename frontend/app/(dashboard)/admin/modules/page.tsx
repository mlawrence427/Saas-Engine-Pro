"use client";

import { useEffect, useState, FormEvent } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";

type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

type Module = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  version: string;
  minPlan: PlanTier;
  isActive: boolean;
  isSystem: boolean;
  requiresReview: boolean;
  createdAt: string;
  updatedAt: string;
};

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export default function AdminModulesPage() {
  const { user } = useAuth();

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [minPlan, setMinPlan] = useState<PlanTier>("FREE");
  const [isActive, setIsActive] = useState(true);
  const [isSystem, setIsSystem] = useState(false);
  const [requiresReview, setRequiresReview] = useState(true);

  const isAdmin = user?.role === "ADMIN";

  // Load existing modules
  useEffect(() => {
    const fetchModules = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:3001/api/modules", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Failed to load modules (${res.status})`);
        }

        const data = (await res.json()) as Module[];
        setModules(data);
      } catch (err: any) {
        console.error("Error loading modules:", err);
        setError(err.message ?? "Failed to load modules");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [isAdmin]);

  async function handleCreateModule(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(
        "http://localhost:3001/api/modules/registry",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug: slug || undefined,
            description: description || undefined,
            minPlan,
            isActive,
            isSystem,
            requiresReview,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to create module (${res.status})`);
      }

      const created = (await res.json()) as Module;
      setModules((prev) => [created, ...prev]);

      // reset form
      setName("");
      setSlug("");
      setDescription("");
      setMinPlan("FREE");
      setIsActive(true);
      setIsSystem(false);
      setRequiresReview(true);
    } catch (err: any) {
      console.error("Create module error:", err);
      setError(err.message ?? "Failed to create module");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <div className="p-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin – Modules</h1>
          <p className="text-sm text-gray-400">
            Manual module creation + registry
          </p>
        </header>

        {!isAdmin && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            You must be an admin to manage modules.
          </div>
        )}

        {isAdmin && (
          <>
            {/* Manual create form */}
            <section className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5 shadow">
              <h2 className="mb-4 text-lg font-semibold">
                Create module manually
              </h2>

              <form
                onSubmit={handleCreateModule}
                className="grid gap-4 md:grid-cols-2"
              >
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-200">
                    Name *
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-200">
                    Slug (optional)
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated from name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200">
                    Description
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description for this module"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200">
                    Minimum plan
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white"
                    value={minPlan}
                    onChange={(e) => setMinPlan(e.target.value as PlanTier)}
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 text-sm text-gray-200">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSystem}
                      onChange={(e) => setIsSystem(e.target.checked)}
                    />
                    <span>System module</span>
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={requiresReview}
                      onChange={(e) => setRequiresReview(e.target.checked)}
                    />
                    <span>Requires review</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex items-center justify-between">
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={saving || !name}
                    className="ml-auto inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {saving ? "Creating..." : "Create module"}
                  </button>
                </div>
              </form>
            </section>

            {/* Existing modules table */}
            <section className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5 shadow">
              <h2 className="mb-4 text-lg font-semibold">Existing modules</h2>

              {loading ? (
                <p className="text-sm text-gray-400">Loading modules...</p>
              ) : modules.length === 0 ? (
                <p className="text-sm text-gray-400">No modules yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-gray-700 text-left text-xs uppercase text-gray-400">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Slug</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Flags</th>
                        <th className="px-3 py-2">Version</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {modules.map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-100">
                              {m.name}
                            </div>
                            {m.description && (
                              <div className="text-xs text-gray-400">
                                {m.description}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-300">
                            {m.slug}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <span className="inline-flex rounded-full bg-gray-800 px-2 py-0.5 text-[11px] text-gray-100">
                              {PLAN_LABELS[m.minPlan]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-300">
                            {m.isSystem && (
                              <span className="mr-2 rounded-full bg-gray-800 px-2 py-0.5">
                                System
                              </span>
                            )}
                            {m.requiresReview && (
                              <span className="mr-2 rounded-full bg-yellow-900/60 px-2 py-0.5 text-yellow-200">
                                Needs review
                              </span>
                            )}
                            {!m.isActive && (
                              <span className="rounded-full bg-red-900/60 px-2 py-0.5 text-red-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-400">
                            {m.version || "1.0.0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AuthGuard>
  );
}


