// frontend/lib/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// Usage: apiUrl("/api/admin/modules")
export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}
