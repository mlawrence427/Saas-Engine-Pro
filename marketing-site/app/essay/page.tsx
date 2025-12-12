// marketing-site/app/essay/page.tsx

export default function EssayPage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">SimpleStates Essay</h1>
        <p className="text-xs mb-2">
          Signal-only primitives. Self-hosted. Deterministic. No magic.
        </p>
        <p className="text-xs mb-2">
          SimpleStates products emit state signals. They do not enforce outcomes.
          They do not authenticate users, authorize actions, or block requests.
        </p>
        <p className="text-[10px]">
          This page describes philosophy and boundaries. It is not a tutorial,
          integration guidance, or a statement of best practice.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          The core idea
        </h2>
        <p>
          Most systems fail by mixing two different things:
        </p>
        <ul className="list-disc list-inside">
          <li>
            <strong>State</strong> (a fact your system can read)
          </li>
          <li>
            <strong>Enforcement</strong> (an outcome your system causes)
          </li>
        </ul>
        <p>
          SimpleStates builds state primitives. Your application implements
          enforcement.
        </p>
        <p>
          A signal can say “denial present,” “expired,” or “plan is Standard.”
          It must never be interpreted as “authorized.”
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Why signal-only exists
        </h2>
        <p>
          Enforcement logic is application-specific. It depends on your routes,
          your domain rules, your UX, and your risk model. A generic enforcement
          layer becomes either:
        </p>
        <ul className="list-disc list-inside">
          <li>over-promised and under-correct</li>
          <li>too invasive to integrate safely</li>
          <li>a hidden dependency that becomes your new outage surface</li>
        </ul>
        <p>
          SimpleStates refuses that role. These tools emit a small set of facts
          at read time. Your code decides what happens next.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Non-negotiable semantics
        </h2>
        <ul className="list-disc list-inside">
          <li>
            <strong>Not denied ≠ permitted.</strong> It only means no denial
            signal is currently present.
          </li>
          <li>
            <strong>Not expired ≠ authorized.</strong> It only means the expiry
            signal does not currently indicate expiration.
          </li>
          <li>
            <strong>Plan state ≠ permission.</strong> It is one input among many
            in your own enforcement logic.
          </li>
          <li>
            <strong>Absence of a restriction is not permission.</strong>
          </li>
        </ul>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          The products and their roles
        </h2>
        <p>
          SimpleStates currently ships three independent primitives:
        </p>
        <ul className="list-disc list-inside">
          <li>
            <strong>SaaS Engine</strong>: emits account and plan state derived
            from billing truth you sync into it.
          </li>
          <li>
            <strong>DenySignal</strong>: emits whether a denial flag exists for a
            subject or scope at read time.
          </li>
          <li>
            <strong>ExpirySignal</strong>: emits whether an entity is expired or
            not expired at read time.
          </li>
        </ul>
        <p>
          These products do not integrate automatically. They do not form a
          framework. The bundle is convenience packaging, not a unified system.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          What SimpleStates refuses to be
        </h2>
        <ul className="list-disc list-inside">
          <li>Not an authentication provider</li>
          <li>Not an authorization framework</li>
          <li>Not a security gateway, firewall, or WAF</li>
          <li>Not a compliance product</li>
          <li>Not a hosted control plane</li>
          <li>Not a managed service</li>
        </ul>
        <p>
          If you want a system that blocks requests by default, you should use a
          dedicated authentication and authorization stack and treat these tools
          as optional signals (or not use them at all).
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Failure modes are your responsibility
        </h2>
        <p>
          SimpleStates is self-hosted. Your environment can misbehave. Networks
          fail. Databases go down. Inputs can be stale or incorrect.
        </p>
        <p>
          Your application must define how to behave when signals cannot be
          confirmed. That includes choosing a fail-open or fail-closed posture
          per use case.
        </p>
        <p>
          SimpleStates emits stored state only. It does not guarantee safety,
          correctness, or appropriateness for your domain.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Who this is for
        </h2>
        <ul className="list-disc list-inside">
          <li>Founders who want deterministic primitives</li>
          <li>Teams who want to own enforcement logic</li>
          <li>Engineers who prefer explicit boundaries over promises</li>
        </ul>
        <p className="mt-2">
          If you want a plug-and-play access control system, SimpleStates is not
          that.
        </p>
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
          Self-hosted. Signal-only. No SLAs. No emergency support.
        </p>
      </section>
    </div>
  );
}
