"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ModulesSection } from "./ModulesSection";
import { UpgradeButton } from "./components/UpgradeButton";

export default function DashboardPage() {
  const { user, isLoading, logout, accessToken } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg text-zinc-300">Loading your dashboard…</p>
      </main>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    return null;
  }

  const displayName = user.name || user.email;

  const subscriptionLabel = () => {
    if (!user.subscriptionStatus || user.subscriptionStatus === "INACTIVE") {
      return "Free plan";
    }
    const planName = user.plan || "pro";
    return `${planName} (${user.subscriptionStatus})`;
  };

  const isSubscribed =
    user.subscriptionStatus === "ACTIVE" ||
    user.subscriptionStatus === "PAST_DUE";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome, {displayName}</h1>
            <p className="text-sm text-zinc-400">
              Plan: {subscriptionLabel()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isSubscribed && <UpgradeButton />}
            <button
              onClick={logout}
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Log out
            </button>
          </div>
        </header>

        {/* ✅ Modules */}
        <ModulesSection accessToken={accessToken} />
      </div>
    </main>
  );
}

