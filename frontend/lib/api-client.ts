// frontend/lib/api-client.ts
import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

/**
 * Shared Axios instance for the SaaS Engine Pro frontend.
 * All requests go to `${API_BASE_URL}/api/...`
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Optional helper to normalize error messages
 * (handy for toasts, form errors, etc.)
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<any>;

    // Backend may send { message } or { error }
    const data = err.response?.data as
      | { message?: string; error?: string }
      | undefined;

    return (
      data?.message ||
      data?.error ||
      err.response?.statusText ||
      err.message ||
      "Something went wrong. Please try again."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
