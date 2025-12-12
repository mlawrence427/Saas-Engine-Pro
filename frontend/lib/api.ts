// frontend/lib/api.ts

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// Base URL for the backend API
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    // critical: send/receive auth cookie
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = 'Request failed';
    let code: string | undefined;

    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
      code = body?.error?.code || body?.code;
    } catch {
      // ignore JSON parse errors
    }

    const err: ApiError = { status: res.status, message, code };
    throw err;
  }

  // If no content, just return undefined
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}


