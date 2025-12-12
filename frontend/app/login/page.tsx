// frontend/app/login/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      plan: string;
    };
    token: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const next = searchParams.get('next') || '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    try {
      const body = { email, password };

      const res = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.success || !res.data?.user) {
        setErr('Invalid credentials');
        setSubmitting(false);
        return;
      }

      // At this point cookie is already set by the backend.
      router.push(next);
    } catch (error) {
      const apiErr = error as ApiError;
      if (apiErr.code === 'INVALID_CREDENTIALS') {
        setErr('Invalid credentials');
      } else {
        setErr(apiErr.message || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050711]">
      <div className="w-full max-w-md border border-zinc-800 bg-black px-10 py-8">
        <div className="mb-8 text-center">
          <div className="text-xs tracking-[0.3em] text-zinc-500 mb-2">
            SAAS ENGINE PRO
          </div>
          <h1 className="text-xl font-medium text-zinc-50">
            Sign in to your control plane
          </h1>
          <p className="mt-2 text-xs text-zinc-500">
            Govern AI-generated modules, plans, and users from a single OS.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black border-zinc-700 text-zinc-50 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black border-zinc-700 text-zinc-50 text-sm"
              required
            />
          </div>

          {err && (
            <div className="border border-red-900 bg-red-950 px-3 py-2 text-xs text-red-300">
              {err}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-zinc-50 text-black text-xs tracking-[0.2em] rounded-none hover:bg-zinc-200"
          >
            {submitting ? 'SIGNING IN…' : 'SIGN IN'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-zinc-500">
            New to SaaS Engine Pro?{' '}
            <Link href="/register" className="underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}




