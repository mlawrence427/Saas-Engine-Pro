"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";

type DraftStatus = "PENDING" | "APPROVED" | "REJECTED";

type AIDraftModule = {
  id: string;
  name: string;
  description?: string | null;
  minPlan: "FREE" | "PRO" | "ENTERPRISE";
  status: DraftStatus;
  createdAt: string;
};

export default function AdminAIModulesPage() {
  const [drafts, setDrafts] = useState<AIDraftModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DraftStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await fetch(apiUrl("/api/admin/ai-modules"), {
          credentials: "include",
        });
        const data = await res.json();
        setDrafts(data.drafts ?? []);
      } catch {
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drafts, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            AI Module Drafts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve AI-generated modules before they go live.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search drafts by name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-sm rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | DraftStatus)
          }
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-slate-400 text-sm">Loading AI drafts…</p>
      )}

      {/* Empty */}
      {!loading && filteredDrafts.length === 0 && (
        <div className="text-center py-16 border border-slate-800 rounded-xl bg-slate-900/50">
          <p className="text-white font-medium">No AI drafts found</p>
          <p className="text-sm text-slate-400 mt-1">
            Once AI starts generating modules, they will appear here for review.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filteredDrafts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-5 py-4 text-left text-xs uppercase text-slate-400">
                    Name
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase text-slate-400">
                    Plan
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs uppercase text-slate-400">
                    Created
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredDrafts.map((draft) => (
                  <tr
                    key={draft.id}
                    className="bg-slate-900 transition-all hover:bg-slate-800/50 hover:shadow-[inset_2px_0_0_0_#22d3ee]"
                  >
                    <td className="px-5 py-4 text-white font-medium">
                      {draft.name}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        {draft.minPlan}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {draft.status === "PENDING" && (
                        <span className="rounded-full bg-yellow-900/30 border border-yellow-500/30 px-2.5 py-1 text-xs text-yellow-300">
                          Pending
                        </span>
                      )}
                      {draft.status === "APPROVED" && (
                        <span className="rounded-full bg-cyan-900/30 border border-cyan-500/30 px-2.5 py-1 text-xs text-cyan-300">
                          Approved
                        </span>
                      )}
                      {draft.status === "REJECTED" && (
                        <span className="rounded-full bg-red-900/30 border border-red-500/30 px-2.5 py-1 text-xs text-red-300">
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/ai-modules/${draft.id}`}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
