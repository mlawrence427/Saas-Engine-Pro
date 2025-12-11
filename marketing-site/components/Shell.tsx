// marketing-site/components/Shell.tsx
import React from 'react';
import Link from 'next/link';

type ShellProps = {
  children: React.ReactNode;
};

export default function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#fdfdfd] text-[12px] leading-snug">
      <div className="max-w-4xl mx-auto border-x border-black">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-black px-4 py-2">
          <div className="text-[10px] tracking-[0.2em] uppercase">
            <Link href="/">SIMPLESTATES</Link>
          </div>
          <nav className="flex gap-4 text-[10px]">
            <Link href="/saas-engine">SaaS Engine</Link>
            <Link href="/accessoff">AccessOff</Link>
            <Link href="/actiontimer">ActionTimer</Link>
          </nav>
        </header>

        {/* Main content */}
        <main className="px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-black px-4 py-2 text-[10px] flex items-center justify-between">
          <span>© SimpleStates 2025</span>
          <span>
            contact:{' '}
            <a
              href="mailto:founder@simple-states.com"
              className="underline"
            >
              founder@simple-states.com
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

