// frontend/app/(dashboard)/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "../../../components/auth/AuthGuard";
import { useAuth } from "../../../context/AuthContext";

type ModuleDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  minPlan: "FREE" | "PRO" | "ENTERPRISE";
  isActive: boolean;
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const res = await fetch("http://localhost:3001/api/modules", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load modules");
        const data = await res.json();
        setModules(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message ?? "Failed to load modules");
      } finally {
        setLoadingModules(false);
      }
    }
    load();
  }, []);

  async function handleGenerateModule(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setAiBusy(true);
      setError(null);

      const res = await fetch("http://localhost:3001/api/modules/ai/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (res.status === 402) {
        setError("Upgrade to Pro to generate modules with AI.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to generate module");
      }

      // Option A: response returns the new module -> append it
      const created = await res.json();
      setModules((prev) => [...prev, created]);

      // Option B (safer): re-fetch full list
      // const list = await fetch("http://localhost:3001/api/modules", {
      //   credentials: "include",
      // });
      // setModules(await list.json());

      setAiPrompt("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "AI generation failed");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <AuthGuard>
      <main
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "4rem",
        }}
      >
        <h1>Dashboard</h1>
        <p style={{ marginBottom: "1rem" }}>
          Welcome, {user?.name ?? user?.email} · Plan: {user?.plan ?? "FREE"}
        </p>

        <button
          onClick={logout}
          style={{ marginBottom: "2rem", padding: "0.5rem 1rem" }}
        >
          Logout
        </button>

        {error && (
          <p style={{ color: "tomato", marginBottom: "1rem" }}>{error}</p>
        )}

        {/* AI module generator */}
        <form
          onSubmit={handleGenerateModule}
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            maxWidth: 600,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe a module you want to add (Pro feature)…"
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: 4,
              border: "1px solid #444",
              background: "#111",
              color: "white",
            }}
          />
          <button
            type="submit"
            disabled={aiBusy}
            style={{ padding: "0.5rem 1rem" }}
          >
            {aiBusy ? "Generating…" : "Generate with AI"}
          </button>
        </form>

        {/* Modules list */}
        <section style={{ maxWidth: 800, width: "100%", padding: "0 1rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>Your modules</h2>

          {loadingModules && <p>Loading modules…</p>}

          {!loadingModules && modules.length === 0 && (
            <p>No modules yet. Try generating one with AI.</p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {modules.map((m) => (
              <div
                key={m.id}
                style={{
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: "1rem",
                  background: "#111",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <strong>{m.name}</strong>
                  {!m.isActive && (
                    <span style={{ color: "tomato", fontSize: "0.8rem" }}>
                      Inactive
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  {m.description ?? "No description"}
                </p>
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  Min plan: {m.minPlan}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}


