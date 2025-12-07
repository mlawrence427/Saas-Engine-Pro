// frontend/app/account/billing/page.tsx
"use client";

import * as React from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

type BillingPlanTier = "FREE" | "PRO" | "ENTERPRISE" | string;

type BillingInfo = {
  plan: BillingPlanTier;
  renewalDate?: string | null;
  status?: string | null;
};

export default function BillingPage() {
  const { toast } = useToast();

  const [billing, setBilling] = React.useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Adjust if your backend exposes /api/account/billing instead.
        const res = await fetch("/api/billing", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to load billing details");
        }

        const data = (await res.json()) as BillingInfo;
        setBilling(data);
      } catch (err) {
        console.error(err);
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to load billing details.";

        setError(msg);
        toast({
          variant: "destructive",
          title: "Billing error",
          description: msg,
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [toast]);

  const handleOpenPortal = async () => {
    try {
      setIsOpeningPortal(true);

      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to start billing portal session");
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Portal URL missing from response");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to open billing portal at this time.";

      toast({
        variant: "destructive",
        title: "Portal error",
        description: msg,
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Billing & plan
          </h1>
          <p className="text-sm text-slate-400">
            Manage your SaaS Engine Pro subscription and invoices.
          </p>
        </header>

        <Card className="border-slate-800 bg-slate-950/70">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm text-slate-200">
                Current subscription
              </CardTitle>
            </div>
            {billing && (
              <Badge
                variant="outline"
                className="border-sky-600/60 text-xs text-sky-400"
              >
                {(billing.plan || "FREE").toString().toUpperCase()}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-40 bg-slate-900" />
                <Skeleton className="h-4 w-64 bg-slate-900" />
              </div>
            ) : error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : billing ? (
              <>
                <p className="text-sm text-slate-300">
                  You&apos;re currently on the{" "}
                  <span className="font-semibold">
                    {(billing.plan || "FREE").toString().toUpperCase()}
                  </span>{" "}
                  plan.
                </p>

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  {billing.renewalDate && (
                    <div>
                      <dt className="text-slate-500">Next renewal</dt>
                      <dd className="text-slate-100 mt-1">
                        {new Date(billing.renewalDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {billing.status && (
                    <div>
                      <dt className="text-slate-500">Status</dt>
                      <dd className="text-slate-100 mt-1">
                        {billing.status}
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <p className="text-sm text-slate-400">
                No billing data returned from the API.
              </p>
            )}

            <div className="pt-2">
              <Button
                className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                disabled={isOpeningPortal}
                onClick={handleOpenPortal}
              >
                {isOpeningPortal ? "Opening portal…" : "Manage billing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
