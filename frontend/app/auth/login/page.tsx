"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading, user } = useAuth();

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, send to dashboard
  if (user) {
    if (typeof window !== "undefined") {
      router.replace("/dashboard");
    }
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      // ✅ Login succeeded – go to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = authLoading || submitting;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-2">Log in</h1>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Use your SaaS Engine Pro account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed py-2 text-sm font-medium"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-500 text-center">
          Don&apos;t have an account?{" "}
          <a
            href="/auth/register"
            className="text-blue-400 hover:text-blue-300"
          >
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}



