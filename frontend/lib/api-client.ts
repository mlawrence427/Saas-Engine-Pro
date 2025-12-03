"use client";

import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // allow cookies/session
});

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

