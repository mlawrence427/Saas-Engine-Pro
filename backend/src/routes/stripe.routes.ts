// backend/src/routes/stripe.routes.ts

import express from "express";

const router = express.Router();

/**
 * We reuse the existing Stripe webhook handler module.
 * That file likely sets up the actual POST /webhooks endpoint
 * and any other Stripe-specific routes.
 *
 * Previously, your server probably did something like:
 *   app.use("/api/stripe", stripeWebhooksRouter);
 *
 * Now we keep the same behavior by mounting it here and letting
 * app.ts use:
 *   app.use("/api/stripe", stripeRoutes);
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stripeWebhooksModule = require("../api/webhooks/stripe.webhooks") as {
  default?: express.Router;
  router?: express.Router;
};

// Try the common export styles: default, named "router", or the module itself.
const webhookRouter: express.Router =
  stripeWebhooksModule.default ??
  stripeWebhooksModule.router ??
  (stripeWebhooksModule as unknown as express.Router);

router.use("/", webhookRouter);

export default router;
