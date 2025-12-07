// frontend/app/account/page.tsx
"use client";

import * as React from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

type AccountPlanTier = "FREE" | "PRO" | "ENTERPRISE" | string;

type AccountData = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  plan?: AccountPlanTier | null;
  createdAt?: string;
};

export default function AccountPage() {
  const { toast } = useToast();

  const [account, setAccount] = React.useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Adjust this endpoint if your backend uses /api/me or similar.
        const res = await fetch("/api/account", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to load account");
        }

        const data = (await res.json()) as AccountData;
        setAccount(data);
      } catch (err) {
        console.error(err);
        const msg =
          err instanceof Error ? err.message : "Unable to load account details.";

        setError(msg);
        toast({
          variant: "destructive",
          title: "Failed to load account",
          description: msg,
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Account
          </h1>
          <p className="text-sm text-slate-400">
            View your profile, role, and plan inside SaaS Engine Pro.
          </p>
        </header>

        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">
              Profile & identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-40 bg-slate-900" />
                <Skeleton className="h-4 w-56 bg-slate-900" />
                <Skeleton className="h-4 w-32 bg-slate-900" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : account ? (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-slate-500">Name</dt>
                  <dd className="text-slate-100 mt-1">
                    {account.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-slate-100 mt-1 break-all">
                    {account.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Role</dt>
                  <dd className="mt-1">
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-xs text-slate-200"
                    >
                      {account.role || "USER"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Plan</dt>
                  <dd className="mt-1">
                    <Badge
                      variant="outline"
                      className="border-sky-600/60 text-xs text-sky-400"
                    >
                      {(account.plan || "FREE").toString().toUpperCase()}
                    </Badge>
                  </dd>
                </div>
                {account.createdAt && (
                  <div>
                    <dt className="text-slate-500">Member since</dt>
                    <dd className="text-slate-100 mt-1">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-slate-400">
                No account data returned from the API.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
