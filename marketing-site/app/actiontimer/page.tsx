// app/actiontimer/page.tsx

export default function ActionTimerPage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">ActionTimer</h1>
        <p className="text-xs mb-2">
          Time-expiry primitive, self-hosted.
        </p>
        <p className="text-xs mb-2">
          ActionTimer is a self-hosted state primitive that stores expiry
          intents and exposes expiry state for your own systems. It does not
          schedule jobs, run workflows, or enforce delays on your behalf. It
          only records targets and emits simple state that your application may
          poll.
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
          ActionTimer stores records representing “something that should change
          at or after a given time.” Your systems may query these records to
          decide whether to allow, delay, or change behavior. Example questions:
        </p>
        <ul className="list-disc list-inside">
          <li>Has this cooldown period finished yet?</li>
          <li>Is this trial or access window considered expired?</li>
          <li>
            Are there outstanding expiry intents that my own job runner should
            process?
          </li>
        </ul>
        <p className="mt-1">Example emitted states include:</p>
        <ul className="list-disc list-inside">
          <li>
            <code>EXPIRY_STATE: PENDING | READY | PAST</code>
          </li>
          <li>
            <code>WINDOW_STATE: ACTIVE | CLOSED</code>
          </li>
          <li>
            <code>CHECK_REQUIRED: YES | NO</code>
          </li>
        </ul>
        <p>
          ActionTimer does not execute actions. It exposes stored time-based
          state that your own scheduler or request handlers may consult.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Inputs &amp; Integration
        </h2>
        <p>Typical inputs you are responsible for wiring:</p>
        <ul className="list-disc list-inside">
          <li>Creation of expiry intents with a target time</li>
          <li>Association between expiry records and accounts/resources</li>
          <li>
            Background or on-demand checks that read ActionTimer state and act
            on it in your own system
          </li>
        </ul>
        <p>
          ActionTimer is not a job runner. It does not guarantee that anything
          happens at or after a time. It exposes data that your code must read
          and act upon.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Delivery Format
        </h2>
        <p>
          ActionTimer is delivered as a self-hosted codebase (database schema,
          server code, and supporting components) via Lemon Squeezy after
          purchase. You operate it in your own environment.
        </p>
        <p>
          There is no hosted service, no remote scheduler, and no guarantee of
          execution timing from SimpleStates.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Does Not Do
        </h2>
        <ul className="list-disc list-inside">
          <li>Does not run background jobs or task queues</li>
          <li>Does not guarantee that actions fire at a specific time</li>
          <li>Does not implement retries, backoff, or workflows</li>
          <li>Does not send emails, notifications, or alerts</li>
        </ul>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Limitations &amp; Failure Modes
        </h2>
        <p>
          Stored expiry data may become stale or incorrect if your inputs are
          misconfigured or not updated. ActionTimer does not validate whether
          expiry times are reasonable or safe.
        </p>
        <p>
          Queries may fail, return partial data, or lag in reflecting recent
          writes if your database or environment is unhealthy. There are no
          timing or delivery guarantees.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">Purchase</h2>
        <p className="mb-1">
          ActionTimer is licensed as a one-time purchase via Lemon Squeezy.
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
          Select the ActionTimer license tier that matches your intended use
          (single internal system vs. multiple internal systems/client work).
        </p>
      </section>
    </div>
  );
}
