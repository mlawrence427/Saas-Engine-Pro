// app/saas-engine/page.tsx

export default function SaaSEnginePage() {
  return (
    <div className="space-y-8">
      <section className="border border-black p-4">
        <h1 className="text-lg mb-1 tracking-tight">SaaS Engine</h1>
        <p className="text-xs mb-2">
          Identity → entitlement → plan truth, self-hosted.
        </p>
        <p className="text-xs mb-2">
          SaaS Engine is a self-hosted state engine that emits identity, plan,
          and entitlement truth for your SaaS or membership system. It does not
          host your app, manage billing providers, or enforce access. It only
          exposes state that your system can query and interpret.
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
          SaaS Engine represents users, plans, and entitlements in a relational
          schema and exposes read surfaces to answer questions like:
        </p>
        <ul className="list-disc list-inside">
          <li>What plan is this user currently on, according to stored data?</li>
          <li>
            Is this user considered allowed or blocked for a given module, based
            on your configured rules?
          </li>
          <li>
            What account state should your application treat as active or
            inactive?
          </li>
        </ul>
        <p className="mt-1">Example emitted states include:</p>
        <ul className="list-disc list-inside">
          <li>
            <code>PLAN_TIER: FREE | STANDARD | COMMERCIAL</code>
          </li>
          <li>
            <code>ENTITLEMENT: ALLOWED | BLOCKED</code> (per feature/module)
          </li>
          <li>
            <code>ACCOUNT_STATE: ACTIVE | SUSPENDED | CANCELED</code>
          </li>
        </ul>
        <p>
          SaaS Engine does not call billing providers on your behalf. It consumes
          whatever subscription or account truth you choose to sync into it and
          emits signals that your application may use when making its own
          decisions.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Inputs &amp; Integration
        </h2>
        <p>Typical inputs you are responsible for wiring:</p>
        <ul className="list-disc list-inside">
          <li>User creation, identification, and lifecycle events</li>
          <li>Plan changes from your billing provider or internal logic</li>
          <li>Entitlement overrides for specific customers</li>
        </ul>
        <p>
          Your application queries SaaS Engine for current stored state and uses
          that as one input among many in your own access and UX logic. All
          enforcement and correctness are your responsibility.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Delivery Format
        </h2>
        <p>
          SaaS Engine is delivered as a self-hosted codebase (database schema,
          server code, and supporting files) via Lemon Squeezy after purchase.
          You are responsible for deployment, configuration, and operation in
          your environment.
        </p>
        <p>
          There is no hosted version, no managed control plane, and no remote
          dependency on SimpleStates infrastructure.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Does Not Do
        </h2>
        <ul className="list-disc list-inside">
          <li>Does not host your application or frontend</li>
          <li>Does not act as an authentication provider</li>
          <li>Does not charge customers or manage Stripe for you</li>
          <li>Does not enforce access at runtime</li>
          <li>Does not schedule jobs, retries, or background workflows</li>
          <li>Does not guarantee correctness of external integration data</li>
        </ul>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">
          Limitations &amp; Failure Modes
        </h2>
        <p>
          State lookups may return stale, inconsistent, or incorrect data
          depending on how and when you sync external truth into SaaS Engine.
          No guarantees are made about accuracy, freshness, completeness, or
          timeliness of state.
        </p>
        <p>
          Lookups may fail, return unexpected data, or reflect partial writes if
          your environment, database, or integrations are misconfigured or
          unhealthy. There are no transactional or distributed consistency
          guarantees.
        </p>
        <p>
          SaaS Engine emits stored state only. It does not validate whether that
          state is legally, commercially, or operationally appropriate for your
          use case.
        </p>
      </section>

      <section className="border border-black p-4 text-xs space-y-2">
        <h2 className="uppercase text-[11px] tracking-tight mb-2">Purchase</h2>
        <p className="mb-1">
          SaaS Engine is licensed as a one-time purchase via Lemon Squeezy.
          Standard and Commercial licenses differ only in legal usage scope, not
          in code or capabilities.
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
          Select the SaaS Engine license tier that matches your intended use
          (single internal system vs. multiple internal systems/client work).
        </p>
      </section>
    </div>
  );
}
