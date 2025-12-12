// frontend/app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';

interface MeResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      role: string;
      plan: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse['data'] extends { user: infer U } ? U | null : null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const res = await apiFetch<MeResponse>('/api/auth/me', {
          method: 'GET',
        });

        if (!res.success || !res.data?.user) {
          throw { status: 401, message: 'Invalid /me response' } as ApiError;
        }

        if (!cancelled) {
          setUser(res.data.user);
        }
      } catch (error: any) {
        console.error('Failed to load /me:', error);

        if (!cancelled) {
          // If unauthorized, send back to login with next=/dashboard
          if (error?.status === 401 || error?.status === 403) {
            router.push('/login?next=/dashboard');
          } else {
            setErr(error?.message || 'Failed to load dashboard');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-300 tracking-wide uppercase">
          Loading control plane…
        </p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="border border-red-500/40 bg-red-950/20 px-6 py-4 text-sm text-red-200">
          {err}
        </div>
      </main>
    );
  }

  if (!user) {
    // Fallback: if somehow no user, send to login
    if (typeof window !== 'undefined') {
      router.push('/login?next=/dashboard');
    }
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              SaaS Engine Pro – Control Plane
            </h1>
            <p className="mt-1 text-xs text-slate-400 uppercase tracking-[0.16em]">
              Signed in as {user.email} · {user.role} · {user.plan}
            </p>
          </div>
        </header>

        <section className="border border-slate-800 bg-black/40 p-6 text-sm">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 mb-4">
            SESSION STATE
          </h2>
          <div className="grid gap-2 text-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role</span>
              <span className="font-mono text-xs">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Plan</span>
              <span className="font-mono text-xs">{user.plan}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}



