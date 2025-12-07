"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard
 * Wraps any children and ensures the user is authenticated.
 * If not authenticated, redirects to /login.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  const shouldRedirect = !user;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/login");
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-sep-muted">
          Redirecting to login…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

