"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModuleMeta } from "@/types/modules";
// Replace with your auth token hook/ctx
// e.g. import { useAuth } from "@/hooks/useAuth";

interface Props {
  accessToken: string;
}

export function ModulesSection({ accessToken }: Props) {
  const [modules, setModules] = useState<ModuleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/modules", {
          // Your Next backend proxy route -> Node backend
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load modules (${res.status})`);
        }

        const data = (await res.json()) as ModuleMeta[];
        if (!cancelled) setModules(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to load modules");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        <div className="text-sm text-neutral-500">Loading modules…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        <div className="text-sm text-red-500">
          Error loading modules: {error}
        </div>
      </section>
    );
  }

  if (!modules.length) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Modules</h2>
        <div className="text-sm text-neutral-500">
          No modules available for your current plan.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Modules</h2>
        <span className="text-xs text-neutral-400">
          Engine Core · {modules.length} enabled
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.key}
            href={`/modules/${mod.key}`}
            className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium">{mod.name}</h3>
              {mod.isPremium && (
                <span className="text-[10px] uppercase tracking-wide rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700">
                  Premium
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mb-2">
              v{mod.version} · {mod.key}
            </p>
            <p className="text-sm text-neutral-700">{mod.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
