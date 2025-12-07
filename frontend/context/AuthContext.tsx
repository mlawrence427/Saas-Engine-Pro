// frontend/context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:3001";
axios.defaults.withCredentials = true;

type User = {
  id: string;
  name: string | null;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  register: (params: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch /me on mount
  useEffect(() => {
    let cancelled = false;

    const fetchMe = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        if (!cancelled) {
          setUser(res.data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMe();

    return () => {
      cancelled = true;
    };
  }, []);

  const register = async (params: {
    name: string;
    email: string;
    password: string;
  }) => {
    const res = await axios.post("/api/auth/register", params);
    // backend should set cookie & return user
    setUser(res.data.user);
  };

  const login = async (params: { email: string; password: string }) => {
    const res = await axios.post("/api/auth/login", params);
    setUser(res.data.user);
  };

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}









