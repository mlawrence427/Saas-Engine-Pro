// frontend/app/dashboard/page.tsx
"use client";

import * as React from "react";

import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type ModuleStatus = "ACTIVE" | "DISABLED" | "DRAFT";

type ModulePlan = "FREE" | "PRO" | "ENTERPRISE" | string;

type Module = {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: ModuleStatus;
  plan?: ModulePlan | null;
  currentVersion?: string | null;
};

export default function DashboardPage() {
  const { toast } = useToast();

  const [modules, setModules] = React.useState<Module[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadModules = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/modules", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load modules.");
      }

      const data = (await response.json()) as Module[];
      setModules(data);
    } catch (error) {
      console.error(error);
      setModules([]);
      toast({
        variant: "destructive",
        title: "Unable to load modules",
        description:
          "We couldn’t fetch your module registry. Please try again shortly.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Optimistic: show spinner but keep current list
    try {
      const response = await fetch("/api/modules", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh modules.");
      }

      const data = (await response.json()) as Module[];
      setModules(data);

      toast({
        title: "Modules refreshed",
        description: "Latest registry state has been loaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "We couldn’t refresh the module registry.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isEmpty = !isLoading && (modules?.length ?? 0) === 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Your SaaS Engine
            </h1>
            <p className="text-sm text-slate-400">
              Launch and govern AI-generated modules, with plan and role gating
              enforced by the engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              {isRefreshing ? "Refreshing…" : "Refresh modules"}
            </Button>
            <Button
              size="sm"
              className="bg-sky-500 text-slate-950 hover:bg-sky-400"
            >
              New workspace (soon)
            </Button>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-300">
              Module registry
            </h2>
            <span className="text-xs text-slate-500">
              Backed by your governed Prisma + audit log.
            </span>
          </div>

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-32 w-full rounded-xl bg-slate-900"
                />
              ))}
            </div>
          )}

          {!isLoading && isEmpty && (
            <Card className="border-slate-800 bg-slate-950/70">
              <CardContent className="py-8 text-center text-sm text-slate-300 space-y-2">
                <p>No modules found yet.</p>
                <p className="text-slate-400">
                  Use the admin console to approve AI-generated modules, or seed
                  the registry from your backend.
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !isEmpty && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules?.map((module) => (
                <Card
                  key={module.id}
                  className="border-slate-800 bg-slate-950/70 flex flex-col"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold text-slate-100">
                          {module.name}
                        </CardTitle>
                        {module.key && (
                          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-slate-500">
                            {module.key}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {module.plan && (
                          <Badge
                            variant="outline"
                            className="border-sky-600/60 text-sky-400 text-[11px]"
                          >
                            {String(module.plan).toUpperCase()}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-[10px] text-slate-300"
                        >
                          {module.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 text-xs text-slate-300 space-y-2">
                    {module.description ? (
                      <p className="line-clamp-3">{module.description}</p>
                    ) : (
                      <p className="italic text-slate-500">
                        No description provided.
                      </p>
                    )}
                    {module.currentVersion && (
                      <p className="text-[11px] text-slate-500">
                        Version:{" "}
                        <span className="font-mono">
                          {module.currentVersion}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

