"use client";

import axios from "axios";

// 🔒 For local development, hard-code the API URL so there is zero ambiguity.
// Later we can make this fancier again if you want.
const apiClient = axios.create({
  baseURL: "http://localhost:3001/api", // ← backend base URL
  withCredentials: true,
});

// ---------------------------------------
// Automatically attach JWT token to headers
// ---------------------------------------
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("saas_engine_auth_token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---------------------------------------
// Unified error handling
// ---------------------------------------
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Request failed"
    );
  }
  return "Something went wrong";
}

export default apiClient;

