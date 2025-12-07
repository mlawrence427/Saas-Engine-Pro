// ============================================================
// frontend/app/admin/layout.tsx - SaaS Engine Pro
// Admin Layout with Sidebar & Auth Guard
// ============================================================

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// NAV ITEMS
// ============================================================

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "📊",
  },
  {
    label: "AI Drafts",
    href: "/admin/ai-drafts",
    icon: "🤖",
    badge: "Review",
  },
  {
    label: "Modules",
    href: "/admin/modules",
    icon: "📦",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: "👥",
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: "📋",
  },
];

// ============================================================
// ADMIN LAYOUT
// ============================================================

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ----------------------------------------------------------
  // Auth Guard: Redirect non-admins
  // ----------------------------------------------------------
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/login?error=unauthorized");
    }
  }, [loading, isAdmin, router]);

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Not authorized
  // ----------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render Admin Layout
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-white">SaaS Engine</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Admin Console</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href));
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }
                    `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${isActive 
                          ? "bg-blue-500 text-white" 
                          : "bg-yellow-500/20 text-yellow-400"
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className={`
                  inline-block w-2 h-2 rounded-full
                  ${user?.role === "FOUNDER" ? "bg-purple-500" : "bg-blue-500"}
                `}></span>
                {user?.role}
              </p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex-1 text-center text-xs text-gray-400 hover:text-white py-2 px-3 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              View Site
            </Link>
            <Link
              href="/logout"
              className="flex-1 text-center text-xs text-gray-400 hover:text-red-400 py-2 px-3 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-800 bg-[#0a0a0a] flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-white">
              {navItems.find(item => 
                pathname === item.href || 
                (item.href !== "/admin" && pathname.startsWith(item.href))
              )?.label || "Admin"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Plan Badge */}
            <span className={`
              text-xs font-medium px-2.5 py-1 rounded-full
              ${user?.plan === "ENTERPRISE" 
                ? "bg-purple-500/20 text-purple-400" 
                : user?.plan === "PRO"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-gray-500/20 text-gray-400"
              }
            `}>
              {user?.plan}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}