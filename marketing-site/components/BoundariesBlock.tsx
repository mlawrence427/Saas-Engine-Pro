// /marketing-site/components/BoundariesBlock.tsx
import React from 'react';

export default function BoundariesBlock() {
  return (
    <section
      aria-labelledby="ss-boundaries-heading"
    >
      <h2 id="ss-boundaries-heading">Boundary Conditions</h2>

      <p>
        SimpleStates tools operate under strict mechanical constraints.
        No uptime guarantees. No SLAs. No emergency response. No regulated
        or safety-critical use. No implied security assurances.
      </p>

      <p>
        These tools emit state only. You are responsible for interpretation,
        orchestration, incident response, and legal compliance in your own
        systems.
      </p>
    </section>
  );
}
