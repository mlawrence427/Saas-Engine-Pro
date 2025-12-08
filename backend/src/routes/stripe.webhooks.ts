// src/routes/stripe.webhooks.ts
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '../config/env';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion as Stripe.LatestApiVersion,
});

/**
 * Basic Stripe webhook handler.
 * You can mount this directly on an Express route.
 */
export async function stripeWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig || typeof sig !== 'string') {
    res.status(400).send('Missing Stripe signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown Stripe error';
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  // TODO: handle the events you actually care about
  switch (event.type) {
    case 'checkout.session.completed':
      // handle checkout
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // handle subscription changes
      break;
    default:
      break;
  }

  res.json({ received: true });
}

