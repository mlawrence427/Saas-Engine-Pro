import Link from 'next/link';
import BoundariesBlock from './BoundariesBlock';

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Header */}
      <header className="mb-10 border-b border-black pb-4">
        <h1 className="font-mono text-2xl tracking-tight">
          <Link href="/">SimpleStates</Link>
        </h1>

        <nav className="mt-2 space-x-4 text-sm font-mono underline">
          <Link href="/saas-engine">SaaS Engine</Link>
          <Link href="/accessoff">AccessOff SDK</Link>
          <Link href="/actiontimer">ActionTimer</Link>
        </nav>
      </header>

      {/* Main */}
      <main>{children}</main>

      {/* Boundaries */}
      <footer className="mt-16 pt-8 border-t border-black text-xs font-mono">
        <BoundariesBlock />

        <div className="mt-6">
          <p className="uppercase tracking-tight">Links</p>
          <ul className="list-disc list-inside mt-2 space-y-2">
            <li>
              <a
                href="https://lemonsqueezy.com/simplestates"
                className="underline"
                target="_blank"
              >
                Lemon Squeezy Store
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@simplestates"
                className="underline"
                target="_blank"
              >
                YouTube
              </a>
            </li>
            <li>
              <a
                href="https://x.com/simplestates"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                X (Twitter)
              </a>
            </li>
          </ul>
        </div>
      </footer>

    </div>
  );
}

