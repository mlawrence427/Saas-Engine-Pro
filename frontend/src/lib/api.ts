// src/lib/api.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ApiError extends Error {
  status?: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error: ApiError = new Error('API Error');
    error.status = res.status;
    let payload: any = null;

    try {
      payload = await res.json();
    } catch {
      // ignore
    }

    (error as any).payload = payload;
    throw error;
  }

  if (res.status === 204) {
    // No content
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'GET' }, token),

  post: <T>(path: string, body: any, token?: string | null) =>
    request<T>(
      path,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      token
    ),
};
