// /marketing-site/components/Shell.tsx
import React from 'react';
import Link from 'next/link';
import BoundariesBlock from './BoundariesBlock';

export default function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ss-shell">
      <header className="ss-header">
        <div className="ss-header-inner">
          <Link href="/" className="ss-logo">
            SimpleStates
          </Link>

          <nav className="ss-nav" aria-label="Primary">
            <Link href="/saas-engine" className="ss-nav-link">
              SaaS Engine
            </Link>
            <Link href="/accessoff" className="ss-nav-link">
              AccessOff
            </Link>
            <Link href="/actiontimer" className="ss-nav-link">
              ActionTimer
            </Link>
          </nav>
        </div>
      </header>

      <main className="ss-main">{children}</main>

      <section
        className="ss-boundaries-wrapper"
        aria-label="Boundary conditions"
      >
        <BoundariesBlock />
      </section>

      <footer className="ss-footer">
        <div className="ss-footer-inner">
          <span>Deterministic. Mechanical. Self-hosted.</span>
        </div>
      </footer>
    </div>
  );
}

