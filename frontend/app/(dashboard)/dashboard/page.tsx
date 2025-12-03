"use client";

import { useAuth } from "@/context/auth-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-sep-muted">Welcome</p>
            <p className="text-sm font-semibold">
              {user ? user.name || user.email : "SaaS Engine Pro user"}
            </p>
            <Badge className="mt-2 w-fit">Starter</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-sep-muted">Status</p>
            <p className="text-sm font-semibold">Ready to build</p>
            <p className="text-xs text-sep-muted">
              This is your base. Plug in your business logic and modules.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-sep-muted">Next steps</p>
            <p className="text-xs text-sep-muted">
              Connect your backend, configure Stripe, and start selling your own SaaS.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

