// app/actiontimer/page.tsx
import { BoundariesBlock } from '../../components/BoundariesBlock';

export default function ActionTimerPage() {
  return (
    <div className="space-y-8 text-xs">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">ActionTimer</h1>
        <p className="mb-2">
          A self-hosted time-expiry state engine. It stores expiry intents and
          exposes expiry state. It does not schedule or execute any actions.
        </p>
        <p className="mb-2">
          ActionTimer emits expiry-related signals only. You decide what to do
          when an intent should be treated as expired according to the data you
          have stored and the time source you trust.
        </p>
        <p className="text-[10px]">
          This page is an operational specification of emitted state. It is not
          integration guidance, legal advice, or a statement of best practice.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Expiry Intents &amp; Signals
        </h2>
        <p>ActionTimer tracks expiry intents such as:</p>
        <ul className="list-disc list-inside">
          <li>Trial periods</li>
          <li>Cool-down windows</li>
          <li>Delayed activations</li>
          <li>Scheduled deactivations</li>
        </ul>
        <p>Typical derived states include:</p>
        <ul className="list-disc list-inside">
          <li>
            <code>
              INTENT_STATE: PENDING | EXPIRED | CANCELED | ACKNOWLEDGED
            </code>
          </li>
          <li>
            Whether, according to the stored timestamp and your current time
            source, an intent should be treated as past expiry.
          </li>
        </ul>
        <p>
          ActionTimer does not run timers or background jobs. Your system
          queries it when needed and interprets the returned state in your own
          logic.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Inputs &amp; Integration
        </h2>
        <p>You are responsible for:</p>
        <ul className="list-disc list-inside">
          <li>Creating expiry intents for your own subject identifiers</li>
          <li>Choosing the timestamps used for expiry decisions</li>
          <li>Driving any follow-up actions when an intent is treated as expired</li>
        </ul>
        <p>
          ActionTimer&apos;s behavior depends entirely on the timestamps,
          subject identifiers, and correlation keys you provide, and on the
          environment in which you run it.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Delivery Format
        </h2>
        <p>
          ActionTimer is delivered as a self-hosted backend codebase (database
          schema and service logic) via Lemon Squeezy. You run it where you run
          your other infrastructure.
        </p>
        <p>
          There is no managed scheduler, no hosted cron service, and no external
          execution environment.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Does Not Do
        </h2>
        <ul className="list-disc list-inside">
          <li>Does not run cron jobs or timers</li>
          <li>Does not send emails, webhooks, or notifications</li>
          <li>Does not guarantee delivery or ordering of any actions</li>
          <li>Does not adjust system clocks or compensate for clock drift</li>
          <li>Does not observe or monitor external systems</li>
        </ul>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Limitations &amp; Failure Modes
        </h2>
        <p>
          Expiry-related signals are derived from stored timestamps and your
          current time source. They are approximate and may be early, late,
          duplicated, or never observed depending on how and when you query the
          system.
        </p>
        <p>
          ActionTimer does not push events or guarantee that any consumer will
          see a given expiry. If your system does not query or process the
          state, no action will occur, regardless of what ActionTimer stores.
        </p>
        <p>
          All timing guarantees, precision requirements, retries, and failure
          handling for expiry workflows belong to your application and
          infrastructure.
        </p>
      </section>

      <section className="border border-black p-4 space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-1">
          Purchase
        </h2>
        <p className="mb-1">
          ActionTimer is licensed as a one-time purchase via Lemon Squeezy.
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
