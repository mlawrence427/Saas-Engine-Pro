"use client";

import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  withCredentials: false,
});

// -----------------------------------------
// Automatically attach JWT token to headers
// -----------------------------------------
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("saas_engine_auth_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// -----------------------------------------
// Unified error handling
// -----------------------------------------
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
