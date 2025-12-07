// ============================================================
// frontend/app/logout/page.tsx - SaaS Engine Pro
// Logout Handler
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// LOGOUT PAGE
// ============================================================

export default function LogoutPage() {
  const router = useRouter();
  const { logout, isAuthenticated, loading: authLoading } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // ----------------------------------------------------------
  // Auto-logout on mount
  // ----------------------------------------------------------
  useEffect(() => {
    const performLogout = async () => {
      // Wait for auth to load
      if (authLoading) return;

      // If not authenticated, just show done state
      if (!isAuthenticated) {
        setDone(true);
        return;
      }

      try {
        setLoggingOut(true);
        await logout();
        setDone(true);

        // Redirect to home after short delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Logout failed");
        setLoggingOut(false);
      }
    };

    performLogout();
  }, [authLoading, isAuthenticated, logout, router]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-lg text-white">SaaS Engine</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {/* Error State */}
          {error ? (
            <>
              <span className="text-5xl mb-6 block">❌</span>
              <h1 className="text-2xl font-bold text-white mb-3">
                Logout Failed
              </h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </>
          ) : done ? (
            /* Success State */
            <>
              <span className="text-5xl mb-6 block">👋</span>
              <h1 className="text-2xl font-bold text-white mb-3">
                You&apos;ve been signed out
              </h1>
              <p className="text-gray-400 mb-6">
                Thanks for using SaaS Engine. See you next time!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium transition-colors"
                >
                  Sign in again
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Go Home
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Redirecting to home page...
              </p>
            </>
          ) : (
            /* Loading State */
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Signing out...
              </h1>
              <p className="text-gray-400">Please wait a moment</p>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} SaaS Engine Pro
      </footer>
    </div>
  );
}