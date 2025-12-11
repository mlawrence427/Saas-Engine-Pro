// app/page.tsx
import Link from 'next/link';
import { BoundariesBlock } from '../components/BoundariesBlock';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-2 tracking-tight">SimpleStates</h1>
        <p className="text-xs mb-1">
          Deterministic. Self-hosted. Mechanical infrastructure tools.
        </p>
        <p className="text-xs">
          SimpleStates is a collection of signal-only primitives for founders
          and engineers who want explicit control without managed services. Each
          product emits state. Your system decides what to do with it.
        </p>
      </section>

      <section className="border border-black p-4">
        <h2 className="uppercase text-[11px] mb-3 tracking-tight">Products</h2>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
          <div className="border border-black p-3 flex flex-col justify-between">
            <div>
              <div className="font-semibold mb-1">SaaS Engine</div>
              <div className="mb-2 text-[11px]">
                Identity → entitlement → plan state. Emits plan truth. Never
                enforces access.
              </div>
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              <Link href="/saas-engine" className="underline">
                → Spec Sheet
              </Link>
            </div>
          </div>

          <div className="border border-black p-3 flex flex-col justify-between">
            <div>
              <div className="font-semibold mb-1">AccessOff SDK</div>
              <div className="mb-2 text-[11px]">
                Execution kill-truth primitive. Emits allowed/denied state for
                execution. Your code halts or proceeds.
              </div>
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              <Link href="/accessoff" className="underline">
                → Spec Sheet
              </Link>
            </div>
          </div>

          <div className="border border-black p-3 flex flex-col justify-between">
            <div>
              <div className="font-semibold mb-1">ActionTimer</div>
              <div className="mb-2 text-[11px]">
                Time-expiry primitive. Stores expiry intents and exposes expiry
                state. No scheduling, no background jobs.
              </div>
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              <Link href="/actiontimer" className="underline">
                → Spec Sheet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-black p-4 text-xs">
        <h2 className="uppercase text-[11px] mb-2 tracking-tight">
          Philosophy
        </h2>
        <p className="mb-1">SimpleStates is built on three constraints:</p>
        <ul className="list-disc list-inside mb-2">
          <li>
            <span className="font-semibold">Deterministic:</span> No background
            jobs, no hidden orchestration, no managed services.
          </li>
          <li>
            <span className="font-semibold">Self-hosted:</span> You run the
            code. No cloud tenancy, no shared runtime, no hosted control plane.
          </li>
          <li>
            <span className="font-semibold">Signal-only:</span> Products emit
            state. Enforcement, retries, and consequences live in your system.
          </li>
        </ul>
        <p>
          This site is an operational specification of these primitives, not
          integration guidance or architectural advice.
        </p>
      </section>

      <BoundariesBlock />
    </div>
  );
}
