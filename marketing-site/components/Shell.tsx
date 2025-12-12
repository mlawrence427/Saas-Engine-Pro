// marketing-site/components/Shell.tsx
import React from 'react';
import Link from 'next/link';

type ShellProps = {
  children: React.ReactNode;
};

export default function Shell({ children }: ShellProps) {
  return (
    <div className="ss-shell">
      {/* Header */}
      <header className="ss-header">
        <div className="ss-header-row">
          <Link href="/" className="ss-logo">
            SIMPLESTATES
          </Link>

          <nav className="ss-nav">
            <Link href="/saas-engine">SaaS Engine</Link>
            <Link href="/deny-signal">DenySignal</Link>
            <Link href="/expiry-signal">ExpirySignal</Link>
            <Link href="/essay">Essay</Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="ss-main">{children}</main>

      {/* Footer */}
      <footer className="ss-footer">
        <span>© SimpleStates 2025</span>
        <span className="ss-footer-separator">·</span>
        <a href="mailto:founder@simple-states.com">founder@simple-states.com</a>
        <span className="ss-footer-separator">·</span>
        <span>Deterministic. Mechanical. Self-hosted.</span>
      </footer>
    </div>
  );
}

