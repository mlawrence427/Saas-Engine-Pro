"use client";

import { useEffect, useState } from "react";
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
};

const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
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
        console.error(err);
        setError(err.message ?? "Failed to load modules");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Welcome back{user?.email ? `, ${user.email}` : ""}. Here are the
              modules available on your plan.
            </p>
          </div>
          {user?.plan && (
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Current plan: {user.plan}
            </div>
          )}
        </div>

        {/* Error / loading state */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !error && (
          <p className="text-sm text-gray-500">Loading your modules…</p>
        )}

        {/* Empty state */}
        {!loading && modules.length === 0 && !error && (
          <div className="border rounded-lg p-6 text-sm text-gray-500 bg-white shadow-sm">
            No modules are currently available on your plan yet.
          </div>
        )}

        {/* Module cards */}
        {!loading && modules.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m.id}
                className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-sm">{m.name}</h2>
                    {m.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                    {PLAN_LABELS[m.minPlan]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {m.isSystem && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-700">
                      System
                    </span>
                  )}
                  {!m.isSystem && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-[10px] text-green-700">
                      App Module
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600">
                    v{m.version || "1.0.0"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="truncate text-gray-400">{m.slug}</span>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}



