// frontend/app/logout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';

export default function LogoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Signing you out...');

  useEffect(() => {
    const run = async () => {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        setMessage('Signed out. Redirecting to /login…');
        setTimeout(() => {
          router.replace('/login');
        }, 800);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setMessage(
            `Logout failed (HTTP ${err.status}). Redirecting to /login anyway.`
          );
          setTimeout(() => {
            router.replace('/login');
          }, 1200);
        } else {
          setMessage('Logout failed. Redirecting to /login.');
          setTimeout(() => {
            router.replace('/login');
          }, 1200);
        }
      }
    };

    void run();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
      <div className="border border-gray-800 bg-gray-950 px-6 py-4 max-w-md w-full">
        <h1 className="text-lg font-mono mb-2">/logout</h1>
        <p className="text-xs text-gray-400 font-mono">{message}</p>
      </div>
    </div>
  );
}
