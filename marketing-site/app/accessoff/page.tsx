// app/accessoff/page.tsx
import { BoundariesBlock } from '../../components/BoundariesBlock';

export default function AccessOffPage() {
  return (
    <div className="space-y-8 text-xs">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">AccessOff SDK</h1>
        <p className="mb-2">
          A self-hosted execution kill-truth engine. Emits execution permission
          state; your code enforces it.
        </p>
        <p className="mb-2">
          AccessOff SDK answers one question:{" "}
          <span className="italic">
            &quot;Should this user be allowed to execute right now?&quot;
          </span>{' '}
          It emits execution truth only as an advisory signal. It never blocks
          requests, kills threads, or manipulates your runtime on its own.
        </p>
        <p className="text-[10px">
          This page is an operational specification of emitted state. It is not
          integration guidance, legal advice, or a statement of best practice.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Signals &amp; Model
        </h2>
        <p>Typical emitted states include:</p>
        <ul className="list-disc list-inside">
          <li>
            <code>EXECUTION: ALLOWED</code>
          </li>
          <li>
            <code>EXECUTION: DENIED</code>
          </li>
          <li>Optional reason codes or metadata describing the decision</li>
        </ul>
        <p>
          Your code is responsible for halting execution when a denied state is
          observed. AccessOff does not patch frameworks, intercept connections,
          or alter underlying systems.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Inputs &amp; Integration
        </h2>
        <p>AccessOff does not discover anything automatically. You supply:</p>
        <ul className="list-disc list-inside">
          <li>Subject identifier (user ID, account ID, API key, etc.)</li>
          <li>Any context you want to store or log with the decision</li>
          <li>
            Any out-of-band rules or overrides you persist in your own data
            model
          </li>
        </ul>
        <p>
          Your integration is responsible for how often you query, how you cache
          results, how you propagate decisions, and how you enforce them.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Delivery Format
        </h2>
        <p>
          AccessOff SDK is delivered as a self-hosted code package via Lemon
          Squeezy. You incorporate it into your stack and deploy it alongside
          your existing services.
        </p>
        <p>
          There is no external API, no managed service, and no remote call back
          to SimpleStates.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Does Not Do
        </h2>
        <ul className="list-disc list-inside">
          <li>Does not authenticate users</li>
          <li>Does not bill or charge customers</li>
          <li>Does not intercept network connections</li>
          <li>Does not patch frameworks or runtimes</li>
          <li>Does not guarantee propagation of decisions across systems</li>
          <li>Does not schedule or retry enforcement</li>
        </ul>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Limitations &amp; Failure Modes
        </h2>
        <p>
          Revocation and execution signals may be delayed, dropped, duplicated,
          or delivered out of order depending on your infrastructure and
          integration. No guarantees are made about timing, ordering, or
          delivery of any decision signal.
        </p>
        <p>
          AccessOff SDK does not prevent execution on its own. If your code does
          not correctly observe and enforce a denied state, execution will
          continue regardless of what AccessOff emitted.
        </p>
        <p>
          All enforcement correctness, propagation semantics, error handling,
          and observability are your responsibility.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Purchase
        </h2>
        <p className="mb-1">
          AccessOff SDK is licensed as a one-time purchase via Lemon Squeezy.
          Standard and Commercial licenses differ only in legal usage scope, not
          in code.
        </p>
        <p>
          Store link:{' '}
          <a
            href="https://lemonsqueezy.com/simplestates"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            https://lemonsqueezy.com/simplestates
          </a>
        </p>
      </section>

      <BoundariesBlock />
    </div>
  );
}
