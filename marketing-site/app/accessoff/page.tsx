// app/accessoff/page.tsx

export default function AccessOffPage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">AccessOff SDK</h1>
        <p className="text-xs mb-2">
          Execution kill-truth primitive, self-hosted.
        </p>
        <p className="text-xs mb-2">
          AccessOff is a self-hosted SDK + service that emits an
          allowed/denied flag for execution paths in your own systems. It does
          not run your code, enforce policies on your behalf, or act as a
          security product. It only exposes state that your system may consult
          before continuing.
        </p>
        <p className="text-[10px]">
          This page is an operational specification of emitted state. It is not
          integration guidance, legal advice, or a statement of best practice.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Signals &amp; Model
        </h2>
        <p>
          AccessOff represents per-account and global kill switches as stored
          flags. Your application queries these flags and decides what to do
          with them. Example questions:
        </p>
        <ul className="list-disc list-inside">
          <li>Is this account currently marked as allowed or denied?</li>
          <li>Is the system in a global OFF state for all execution?</li>
          <li>
            Should this call path treat the current state as hard-stop or
            soft-warning?
          </li>
        </ul>
        <p className="mt-1">Example emitted states include:</p>
        <ul className="list-disc list-inside">
          <li>
            <code>ACCOUNT_EXECUTION: ALLOWED | DENIED</code>
          </li>
          <li>
            <code>GLOBAL_EXECUTION: NORMAL | OFF</code>
          </li>
          <li>
            <code>DENIAL_REASON: FLAGGED | MANUAL | UNKNOWN</code>
          </li>
        </ul>
        <p>
          AccessOff does not interpret these states for you. It exposes stored
          flags that your own code may read and branch on. All enforcement and
          consequences live in your system.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Inputs &amp; Integration
        </h2>
        <p>Typical inputs you are responsible for wiring:</p>
        <ul className="list-disc list-inside">
          <li>Account identifiers and lookup keys</li>
          <li>Events that should set or clear execution flags</li>
          <li>
            Operator actions (for example, manually disabling an abusive or
            disputed account)
          </li>
        </ul>
        <p>
          Your application calls AccessOff for current stored state and treats
          the result as one input among many in your own decision logic. AccessOff
          does not guarantee that your branching is correct or sufficient.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Delivery Format
        </h2>
        <p>
          AccessOff is delivered as self-hosted code (database schema, server
          components, and SDK integration points) via Lemon Squeezy after
          purchase. You are responsible for deployment, configuration, and
          operation in your environment.
        </p>
        <p>
          There is no hosted version, no managed off-switch, and no remote
          dependency on SimpleStates infrastructure.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Does Not Do
        </h2>
        <ul className="list-disc list-inside">
          <li>Does not inspect traffic or payload contents</li>
          <li>Does not act as a firewall or WAF</li>
          <li>Does not perform fraud scoring or abuse detection</li>
          <li>Does not enforce rate limits or throttling</li>
          <li>Does not provide legal, compliance, or incident guidance</li>
        </ul>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Limitations &amp; Failure Modes
        </h2>
        <p>
          Execution flags may be stale, incomplete, or misconfigured depending
          on how and when you update them. No guarantees are made about
          correctness, appropriateness, or timeliness of the stored state.
        </p>
        <p>
          AccessOff may fail to return data, may return unexpected combinations
          of flags, or may reflect partial writes if your environment or
          database is unhealthy. There are no transactional or distributed
          consistency guarantees.
        </p>
        <p>
          AccessOff emits stored flags only. It does not determine whether
          halting or continuing execution is appropriate in your context.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">Purchase</h2>
        <p className="mb-1">
          AccessOff is licensed as a one-time purchase via Lemon Squeezy.
          License tiers differ only in legal usage scope, not in code or
          capabilities.
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
        <p className="text-[10px]">
          Select the AccessOff license tier that matches your intended use
          (single internal system vs. multiple internal systems/client work).
        </p>
      </section>
    </div>
  );
}
