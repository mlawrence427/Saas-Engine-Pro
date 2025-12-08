// src/routes/stripe.webhooks.ts
import express, { type Request, type Response } from 'express';
import billingService from '../services/billing.service';

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 *
 * Mounted in app.ts as:
 *   app.use('/api/webhooks', stripeWebhookRouter);
 *
 * We MUST use express.raw here so Stripe signature verification works.
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig || typeof sig !== 'string') {
      res.status(400).send('Missing Stripe signature');
      return;
    }

    try {
      // req.body is a Buffer because of express.raw()
      const result = await billingService.handleWebhook(
        req.body as Buffer,
        sig
      );

      res.json(result);
    } catch (err) {
      console.error('[stripe] Webhook handler error:', err);
      // 4xx/5xx here will cause Stripe to retry, which is what we want on failure
      res.status(400).send('Webhook handler error');
    }
  }
);

export default router;




