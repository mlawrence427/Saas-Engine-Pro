"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import apiClient from "../lib/api-client";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "saas_engine_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    if (stored) {
      setToken(stored);
      fetchUser(stored).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUser(existingToken?: string) {
    try {
      const res = await apiClient.get("/api/user/me", {
        headers: {
          Authorization: `Bearer ${existingToken || token}`,
        },
      });
      setUser(res.data);
    } catch {
      setUser(null);
      setToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  async function login(email: string, password: string) {
    const res = await apiClient.post("/api/auth/login", { email, password });
    const newToken = res.data.token;
    setToken(newToken);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newToken);
    }
    await fetchUser(newToken);
  }

  async function register(email: string, password: string, name?: string) {
    await apiClient.post("/api/auth/register", { email, password, name });
    await login(email, password);
  }

  function logout() {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
