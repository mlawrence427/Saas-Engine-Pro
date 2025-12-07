// ============================================================
// frontend/app/register/page.tsx - SaaS Engine Pro
// Registration Page
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// REGISTER PAGE
// ============================================================

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const passwordMinLength = 8;
  const passwordValid = password.length >= passwordMinLength;
  const passwordsMatch = password === confirmPassword;

  // ----------------------------------------------------------
  // Redirect if already authenticated
  // ----------------------------------------------------------
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/modules");
    }
  }, [authLoading, isAuthenticated, router]);

  // ----------------------------------------------------------
  // Submit handler
  // ----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!passwordValid) {
      setError(`Password must be at least ${passwordMinLength} characters`);
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await register({ email: email.trim(), password });

      // Redirect handled by useEffect above
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Create your account
            </h1>
            <p className="text-gray-400">
              Start building with AI-powered modules
            </p>
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 bg-[#111111] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  password && !passwordValid
                    ? "border-red-500"
                    : password && passwordValid
                    ? "border-green-500"
                    : "border-gray-800 focus:border-blue-500"
                }`}
                disabled={loading}
              />
              {/* Password Requirements */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-xs ${
                    password
                      ? passwordValid
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-gray-500"
                  }`}
                >
                  {passwordValid ? "✓" : "○"} At least {passwordMinLength} characters
                </span>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 bg-[#111111] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500"
                    : confirmPassword && passwordsMatch
                    ? "border-green-500"
                    : "border-gray-800 focus:border-blue-500"
                }`}
                disabled={loading}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-2 text-xs text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !email.trim() ||
                !passwordValid ||
                !passwordsMatch
              }
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Creating account...
                </span>
              ) : (
                "Create account"
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
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="block w-full px-4 py-3 bg-gray-800 text-white rounded-xl font-medium text-center hover:bg-gray-700 transition-colors"
          >
            Sign in
          </Link>

          {/* Features List */}
          <div className="mt-8 p-4 bg-[#111111] rounded-xl border border-gray-800">
            <p className="text-sm font-medium text-white mb-3">
              What you get with a free account:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-green-400">✓</span>
                Access to free modules
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-green-400">✓</span>
                AI-powered module suggestions
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-green-400">✓</span>
                Upgrade anytime to unlock more
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} SaaS Engine Pro
      </footer>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}