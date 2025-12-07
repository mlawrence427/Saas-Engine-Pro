// ============================================================
// frontend/context/AuthContext.tsx - SaaS Engine Pro
// Auth Context with Role & Plan Support
// ============================================================

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import axios, { AxiosError } from "axios";

// ============================================================
// AXIOS CONFIGURATION
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// ============================================================
// TYPES
// ============================================================

export type Role = "USER" | "ADMIN" | "FOUNDER";
export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export type User = {
  id: string;
  email: string;
  role: Role;
  plan: PlanTier;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Auth actions
  register: (params: { email: string; password: string }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Permission helpers
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFounder: boolean;
  hasMinRole: (minRole: Role) => boolean;
  hasMinPlan: (minPlan: PlanTier) => boolean;
  canAccessModule: (moduleMinPlan: PlanTier) => boolean;
};

// ============================================================
// ROLE & PLAN HIERARCHIES
// ============================================================

const ROLE_LEVELS: Record<Role, number> = {
  USER: 0,
  ADMIN: 1,
  FOUNDER: 2,
};

const PLAN_LEVELS: Record<PlanTier, number> = {
  FREE: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Fetch current user
  // ----------------------------------------------------------
  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get("/api/auth/me");
      if (res.data.success && res.data.data?.user) {
        setUser(res.data.data.user);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      // Don't set error for 401 (just not logged in)
      if (err instanceof AxiosError && err.response?.status !== 401) {
        setError("Failed to fetch user");
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Initial load
  // ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      await fetchUser();
      if (!cancelled) {
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [fetchUser]);

  // ----------------------------------------------------------
  // Register
  // ----------------------------------------------------------
  const register = async (params: { email: string; password: string }) => {
    setError(null);
    try {
      const res = await axios.post("/api/auth/register", params);
      if (res.data.success && res.data.data?.user) {
        setUser(res.data.data.user);
      } else {
        throw new Error(res.data.message || "Registration failed");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const message = err.response?.data?.message || "Registration failed";
        setError(message);
        throw new Error(message);
      }
      throw err;
    }
  };

  // ----------------------------------------------------------
  // Login
  // ----------------------------------------------------------
  const login = async (params: { email: string; password: string }) => {
    setError(null);
    try {
      const res = await axios.post("/api/login", params);
      if (res.data.success && res.data.data?.user) {
        setUser(res.data.data.user);
      } else {
        throw new Error(res.data.message || "Login failed");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const message = err.response?.data?.message || "Invalid credentials";
        setError(message);
        throw new Error(message);
      }
      throw err;
    }
  };

  // ----------------------------------------------------------
  // Logout
  // ----------------------------------------------------------
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // Ignore errors, clear user anyway
    }
    setUser(null);
    setError(null);
  };

  // ----------------------------------------------------------
  // Refresh user (call after plan/role changes)
  // ----------------------------------------------------------
  const refreshUser = async () => {
    await fetchUser();
  };

  // ----------------------------------------------------------
  // Permission helpers
  // ----------------------------------------------------------
  const isAuthenticated = user !== null;
  const isAdmin = user !== null && ROLE_LEVELS[user.role] >= ROLE_LEVELS.ADMIN;
  const isFounder = user !== null && user.role === "FOUNDER";

  const hasMinRole = useCallback(
    (minRole: Role): boolean => {
      if (!user) return false;
      return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minRole];
    },
    [user]
  );

  const hasMinPlan = useCallback(
    (minPlan: PlanTier): boolean => {
      if (!user) return false;
      return PLAN_LEVELS[user.plan] >= PLAN_LEVELS[minPlan];
    },
    [user]
  );

  const canAccessModule = useCallback(
    (moduleMinPlan: PlanTier): boolean => {
      if (!user) return false;
      // Admins/Founders can access everything
      if (ROLE_LEVELS[user.role] >= ROLE_LEVELS.ADMIN) return true;
      return PLAN_LEVELS[user.plan] >= PLAN_LEVELS[moduleMinPlan];
    },
    [user]
  );

  // ----------------------------------------------------------
  // Context value
  // ----------------------------------------------------------
  const value: AuthContextValue = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshUser,
    isAuthenticated,
    isAdmin,
    isFounder,
    hasMinRole,
    hasMinPlan,
    canAccessModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// HOOK
// ============================================================

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// ============================================================
// GUARD COMPONENTS
// ============================================================

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/** Shows children only if user is authenticated */
export function RequireAuth({ children, fallback = null }: GuardProps) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!isAuthenticated) return <>{fallback}</>;
  return <>{children}</>;
}

/** Shows children only if user is admin or founder */
export function RequireAdmin({ children, fallback = null }: GuardProps) {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!isAdmin) return <>{fallback}</>;
  return <>{children}</>;
}

/** Shows children only if user has required plan */
export function RequirePlan({ 
  minPlan, 
  children, 
  fallback = null 
}: GuardProps & { minPlan: PlanTier }) {
  const { hasMinPlan, loading } = useAuth();
  
  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!hasMinPlan(minPlan)) return <>{fallback}</>;
  return <>{children}</>;
}









