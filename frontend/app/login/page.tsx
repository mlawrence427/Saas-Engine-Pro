// ============================================================
// frontend/app/login/page.tsx - SaaS Engine Pro
// Login Page
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// LOGIN PAGE
// ============================================================

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading: authLoading, isAdmin } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get redirect URL and error from query params
  const redirectTo = searchParams.get("redirect") || "/modules";
  const queryError = searchParams.get("error");

  // ----------------------------------------------------------
  // Redirect if already authenticated
  // ----------------------------------------------------------
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // If user is admin and no specific redirect, go to admin
      if (isAdmin && redirectTo === "/modules") {
        router.push("/admin");
      } else {
        router.push(redirectTo);
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router, redirectTo]);

  // ----------------------------------------------------------
  // Handle query error
  // ----------------------------------------------------------
  useEffect(() => {
    if (queryError === "unauthorized") {
      setError("You must be an admin to access that page");
    } else if (queryError === "session_expired") {
      setError("Your session has expired. Please sign in again.");
    }
  }, [queryError]);

  // ----------------------------------------------------------
  // Submit handler
  // ----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await login({ email: email.trim(), password });

      // Redirect handled by useEffect above
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Show loading while checking auth
  // ----------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 bg-[#111111] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[#111111] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0a0a0a] text-gray-500">
                New to SaaS Engine?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="block w-full px-4 py-3 bg-gray-800 text-white rounded-xl font-medium text-center hover:bg-gray-700 transition-colors"
          >
            Create an account
          </Link>

          {/* Demo Credentials (dev only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Development only:</p>
              <button
                type="button"
                onClick={() => {
                  setEmail("founder@saasengine.pro");
                  setPassword("changeme123");
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Fill founder credentials
              </button>
            </div>
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