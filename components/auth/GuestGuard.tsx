"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface GuestGuardProps {
  children: ReactNode;
}

/**
 * GuestGuard
 * Used for auth pages (login/register).
 * If the user is already logged in, redirects to /dashboard.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  const isLoggedIn = !!user;

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-sep-muted">
          Redirecting to your dashboard…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

