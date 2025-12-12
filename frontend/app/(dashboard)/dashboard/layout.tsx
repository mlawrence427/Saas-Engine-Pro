// frontend/app/(dashboard)/dashboard/layout.tsx
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavLinkProps = {
  href: string;
  label: string;
};

function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href !== '/dashboard' && pathname.startsWith(href));

  const baseClasses =
    'block px-2 py-1 border border-transparent hover:bg-gray-900 hover:border-gray-700';
  const activeClasses = isActive
    ? 'bg-gray-900 border-gray-700 text-emerald-400'
    : '';

  return (
    <Link href={href} className={`${baseClasses} ${activeClasses}`}>
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            SaaS Engine
          </span>
          <span className="text-sm font-mono text-gray-200">
            Control Plane / Dashboard
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-500">
            status:{' '}
            <span className="text-emerald-400">
              auth-ok
            </span>
          </span>
          <Link
            href="/logout"
            className="border border-gray-700 px-3 py-1 uppercase tracking-wide text-[10px] hover:bg-gray-900"
          >
            logout
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 border-r border-gray-800 px-4 py-6">
          <nav className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">
                main
              </div>
              <NavLink href="/dashboard" label="/dashboard" />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">
                control panels
              </div>
              <NavLink href="/dashboard/modules" label="modules" />
              <NavLink href="/dashboard/plans" label="plans & billing" />
              <NavLink href="/dashboard/audit-log" label="audit log" />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">
                system
              </div>
              <NavLink href="/dashboard/settings" label="settings" />
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 py-6">
          <div className="max-w-5xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}






