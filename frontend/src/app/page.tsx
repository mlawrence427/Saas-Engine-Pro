// frontend/src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/register");
    }
  }, [user, isLoading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-300">Loading SaaS Engine Pro…</p>
    </main>
  );
}

