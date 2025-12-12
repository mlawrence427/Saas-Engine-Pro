// app/expiry-signal/page.tsx

export default function ExpirySignalPage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">ExpirySignal</h1>
        <p className="text-xs mb-2">
          Self-hosted expiration signal primitive. Signal-only.
        </p>
        <p className="text-xs mb-2">
          ExpirySignal is a self-hosted expiration signal primitive.
        </p>
        <p className="text-xs mb-2">
          It stores and returns whether an entity is expired or not expired at
          read time.
        </p>
        <p className="text-xs mb-2">
          ExpirySignal does not expire anything automatically. It emits
          expiration state only.
        </p>
        <p className="text-[10px]">
          This page describes emitted state semantics. It is not integration
          guidance, legal advice, or a statement of best practice.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          What it emits
        </h2>
        <ul className="list-disc list-inside">
          <li>Expired</li>
          <li>Not expired</li>
        </ul>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          What it does not do
        </h2>
        <ul className="list-disc list-inside">
          <li>Does not invalidate tokens</li>
          <li>Does not revoke sessions</li>
          <li>Does not log users out</li>
          <li>Does not block requests</li>
        </ul>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Typical use
        </h2>
        <p>
          Your application checks expiration state before executing
          time-sensitive actions and explicitly decides how to proceed.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Important
        </h2>
        <p>
          Not expired ≠ authorized. Expiration state is advisory, not
          enforcement.
        </p>
        <p>
          Self-hosted. Signal-only. No background jobs.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Delivery format
        </h2>
        <p>
          ExpirySignal is delivered as a self-hosted codebase (database schema,
          server code, and supporting files) via Lemon Squeezy after purchase.
          You are responsible for deployment, configuration, and operation in
          your environment.
        </p>
        <p>
          There is no hosted service, no remote scheduler, and no background
          execution provided by SimpleStates.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Limitations &amp; failure modes
        </h2>
        <p>
          Expiration state may be stale or incorrect depending on how and when
          your system writes or updates expiry data. No guarantees are made
          about accuracy, freshness, or timing.
        </p>
        <p>
          Lookups may fail, return unexpected data, or reflect partial writes if
          your environment or database is unhealthy. There are no execution or
          delivery guarantees.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">Purchase</h2>
        <p className="mb-1">
          ExpirySignal is licensed as a one-time purchase via Lemon Squeezy.
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
          Select the ExpirySignal license tier that matches your intended use
          (single internal system vs. multiple internal systems/client work).
        </p>
      </section>
    </div>
  );
}
