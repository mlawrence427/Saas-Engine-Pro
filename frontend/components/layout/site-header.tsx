"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/settings") || pathname.startsWith("/billing");

  return (
    <header className="border-b border-sep-border bg-sep-card">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-sep-primary/10 flex items-center justify-center text-xs font-bold text-sep-primary">
            SE
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">SaaS Engine Pro</span>
            <span className="text-[10px] text-sep-muted">
              Universal SaaS starter kit
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-xs">
          {!user && (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                Log in
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}

          {user && (
            <>
              {isDashboardRoute ? (
                <Link href="/dashboard" className="hidden sm:inline-block text-sep-muted hover:text-sep-foreground">
                  Dashboard
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="sm" variant="outline">Open dashboard</Button>
                </Link>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={logout}
              >
                Log out
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

