"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  // later: call /api/billing summary from backend
  return (
    <DashboardShell title="Billing">
      <div className="space-y-4 max-w-2xl">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-sep-muted">Current plan</p>
            <p className="text-sm font-semibold">Starter (example)</p>
            <p className="text-xs text-sep-muted">
              Connect Stripe on the backend to make this reflect real subscription state.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Upgrade to Pro</p>
            <p className="text-xs text-sep-muted">
              This is where you would trigger a Stripe Checkout session via your backend.
            </p>
            <Button className="w-fit">Go to checkout</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

