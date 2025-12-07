// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type User = {
  id: string;
  name?: string | null;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "saas_engine_token";

type Props = {
  children: ReactNode;
};

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore token + fetch /me on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      refreshUser(savedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const authToken = (options as any)._tokenOverride || token;

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const res = await fetch(`/api/auth${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.error?.message || data?.message || "Something went wrong";
      const code = data?.error?.code || "UNKNOWN_ERROR";
      throw new Error(`${code}: ${message}`);
    }

    return data;
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const newToken = data.token as string;
      const user = data.user as User;

      setToken(newToken);
      setUser(user);
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      const newToken = data.token as string;
      const user = data.user as User;

      setToken(newToken);
      setUser(user);
      localStorage.setItem(TOKEN_KEY, newToken);
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (overrideToken?: string) => {
    setError(null);
    try {
      const data = await apiFetch("/me", {
        method: "GET",
        // small hack to pass token before context is updated on first load
        // @ts-ignore
        _tokenOverride: overrideToken,
      } as any);

      const user = data.user as User;
      setUser(user);
    } catch (err: any) {
      console.error("ME ERROR:", err);
      // If token is bad, blow it away
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setError(err.message || "Session invalid");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
