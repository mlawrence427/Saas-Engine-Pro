"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios, { AxiosError } from "axios";

type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "CANCELED" | "PAST_DUE" | null;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role?: string | null;
  plan?: string | null;
  subscriptionStatus?: SubscriptionStatus;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  register: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

// Base API client (JWT via Authorization header)
const apiClient = axios.create({
  baseURL: "http://localhost:3001/api",
});

// Helper to apply/remove Authorization header globally
function applyAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load current user from /user/me
  const refreshMe = useCallback(async () => {
    try {
      const res = await apiClient.get("/user/me");
      setUser(res.data.user ?? null);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 401) {
        // Not logged in / invalid token
        setUser(null);
      } else {
        console.error("[Auth] /user/me error:", err);
      }
    }
  }, []);

  // On mount: restore token from localStorage and hydrate /me
  useEffect(() => {
    (async () => {
      setIsLoading(true);

      if (typeof window !== "undefined") {
        const storedToken = window.localStorage.getItem("authToken");
        if (storedToken) {
          setToken(storedToken);
          applyAuthToken(storedToken);
        }
      }

      await refreshMe();
      setIsLoading(false);
    })();
  }, [refreshMe]);

  // Login: store token, set header, then hydrate /me
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await apiClient.post("/auth/login", { email, password });

        const receivedToken: string | undefined = res.data?.token;
        if (!receivedToken) {
          console.error("[Auth] Login response missing token:", res.data);
          throw new Error("Login failed: missing token");
        }

        setToken(receivedToken);
        applyAuthToken(receivedToken);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("authToken", receivedToken);
        }

        await refreshMe();
      } catch (err) {
        const axiosErr = err as AxiosError<any>;
        const msg =
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.message ||
          "Login failed";
        console.error("[Auth] login error:", msg, err);
        throw new Error(msg);
      }
    },
    [refreshMe]
  );

  // Register then auto-login.
  // If the backend says "User already exists", fall back to login.
  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        await apiClient.post("/auth/register", { email, password, name });
        await login(email, password);
      } catch (err) {
        const axiosErr = err as AxiosError<any>;
        const msg =
          axiosErr.response?.data?.error ||
          axiosErr.response?.data?.message ||
          "Registration failed";

        console.error("[Auth] register error:", msg, err);

        if (msg === "User already exists") {
          console.warn("[Auth] user already exists, trying login instead");
          await login(email, password);
          return;
        }

        throw new Error(msg);
      }
    },
    [login]
  );

  // Logout: optional POST /auth/logout, then clear token + user
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout").catch(() => {});
    } catch (err) {
      console.error("[Auth] logout error:", err);
    } finally {
      setUser(null);
      setToken(null);
      applyAuthToken(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("authToken");
      }
    }
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    refreshMe,
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



