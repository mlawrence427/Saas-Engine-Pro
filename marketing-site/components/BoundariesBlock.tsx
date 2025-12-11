// components/BoundariesBlock.tsx
export function BoundariesBlock() {
  return (
    <section className="mt-8 border border-black p-4 text-xs leading-relaxed bg-neutral-50">
      <h2 className="uppercase text-[11px] mb-2 tracking-tight">
        Boundaries &amp; Conditions of Use
      </h2>
      <p className="mb-2">
        SimpleStates products are self-hosted software components. They emit
        advisory state signals and data structures based solely on the inputs
        and environment provided by the customer. They do not enforce access,
        validate correctness, maintain state integrity, guarantee availability,
        monitor usage, or execute any actions.
      </p>
      <p className="mb-2">
        These tools emit signals and data structures without guarantees of
        accuracy, timeliness, completeness, or delivery; all consequential
        decisions, enforcement actions, and failure handling are your sole
        responsibility.
      </p>
      <p className="mb-2">
        &quot;Deterministic&quot; in this context refers only to internal input
        processing (given the same stored data and inputs, the same signal is
        computed). It does not and cannot guarantee correct output, reliable
        operation, timely delivery, data freshness, or fitness for any
        particular purpose.
      </p>
      <p className="mb-2">
        SimpleStates products are not suitable for, and must not be used in:
      </p>
      <ul className="list-disc list-inside mb-2">
        <li>safety-critical or life-safety systems</li>
        <li>medical or healthcare applications</li>
        <li>financial trading, settlement, or transaction control</li>
        <li>regulatory compliance or legally mandated workflows</li>
        <li>critical infrastructure or emergency systems</li>
      </ul>
      <p className="mb-2">
        Do not use these tools for any decision or workflow where failure, delay,
        inaccuracy, or non-delivery of a signal could result in financial loss,
        data exposure, regulatory violation, safety incident, or significant
        reputational harm.
      </p>
      <p className="mb-2">
        Purchase grants a license to the delivered version only. No updates,
        maintenance, warranties, SLAs, guarantees, refunds (where legally
        permitted), or support are provided.
      </p>
      <p>
        Integration, correctness, enforcement, observability, security,
        monitoring, and all failure handling are entirely the customer&apos;s
        responsibility.
      </p>
    </section>
  );
}
