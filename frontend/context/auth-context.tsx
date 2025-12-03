"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiClient, getErrorMessage } from "@/lib/api-client";

// Shape of the user returned from the backend
export interface User {
  id: string;
  email: string;
  name?: string;
  role: "USER" | "SUBSCRIBER" | "ADMIN";
}

// Context value shape
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  initializing: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch user session on mount
   * (restores login state on refresh)
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, []);

  /**
   * LOGIN
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      setUser(res.data.user);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * REGISTER
   */
  const register = async (data: {
    email: string;
    password: string;
    name?: string;
  }) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", data);
      setUser(res.data.user);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * LOGOUT
   */
  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post("/auth/logout");
      setUser(null);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manual refresh — used after billing/subscription changes
   */
  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initializing,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {!initializing && children}
    </AuthContext.Provider>
  );
};

/**
 * Hook for easy access
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
};
