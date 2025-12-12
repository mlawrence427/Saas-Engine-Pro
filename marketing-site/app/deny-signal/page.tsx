// marketing-site/app/deny-signal/page.tsx

export default function DenySignalPage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">DenySignal</h1>

        <p className="text-xs mb-2">
          DenySignal is a self-hosted denial signal primitive (negative capability).
        </p>

        <div className="text-xs space-y-2">
          <p>
            It records whether a denial flag exists for a subject or scope and returns the current
            denial signal at read time.
          </p>

          <p className="font-semibold">
            DenySignal does not deny access, block execution, or authorize actions.
          </p>
          <p>It only emits whether a denial signal is present.</p>

          <p className="uppercase text-[11px] tracking-tight mt-3">What it emits</p>
          <ul className="list-disc list-inside">
            <li>Denial present</li>
            <li>Denial not present</li>
          </ul>

          <p className="uppercase text-[11px] tracking-tight mt-3">What it does NOT do</p>
          <ul className="list-disc list-inside">
            <li>Does not authenticate identity</li>
            <li>Does not authorize actions</li>
            <li>Does not block requests</li>
            <li>Does not act as a firewall, WAF, or gateway</li>
          </ul>

          <p className="uppercase text-[11px] tracking-tight mt-3">Typical use</p>
          <p>
            Before performing a sensitive operation, your application queries DenySignal and
            explicitly decides how to handle a denial signal.
          </p>

          <p className="uppercase text-[11px] tracking-tight mt-3">Critical rule</p>
          <p className="font-semibold">Not denied ≠ permitted.</p>
          <p>It only means no denial signal is currently present.</p>

          <p className="mt-3">Self-hosted. Signal-only. Deterministic behavior.</p>
        </div>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">Purchase</h2>
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
          License tiers differ only in legal usage scope, not in code or capabilities.
        </p>
      </section>
    </div>
  );
}
