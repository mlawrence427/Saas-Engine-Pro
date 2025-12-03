"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" }
];

export function DashboardShell({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-xs text-sep-muted">
          SaaS Engine Pro &middot; Demo dashboard
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <aside className="w-full md:w-52 flex-shrink-0">
          <nav className="space-y-1 text-xs">
            {navItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 ${
                    active
                      ? "bg-sep-primary/10 text-sep-primary"
                      : "text-sep-muted hover:text-sep-foreground hover:bg-sep-border/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1">
          {children}
        </section>
      </div>
    </div>
  );
}

