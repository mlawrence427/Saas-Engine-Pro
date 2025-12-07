// ============================================================
// src/routes/webhooks.ts - SaaS Engine Pro
// Webhook Routes (Stripe, etc.)
// ============================================================

import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../prismaClient';
import { PlanTier, AuditAction, AuditEntityType } from '@prisma/client';

const router = Router();

// ============================================================
// STRIPE CONFIGURATION
// ============================================================

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  : null;

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Map Stripe price IDs to plan tiers
const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [process.env.STRIPE_PRICE_PRO || 'price_pro']: PlanTier.PRO,
  [process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise']: PlanTier.ENTERPRISE,
};

// ============================================================
// POST /api/webhooks/stripe
// Handle Stripe webhook events
// ============================================================

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe not configured');
      res.status(500).json({ error: 'Stripe not configured' });
      return;
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          // Could add invoice tracking here
          console.log('Payment succeeded:', event.data.object);
          break;

        case 'invoice.payment_failed':
          // Could add payment failure handling here
          console.log('Payment failed:', event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });

    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

// ============================================================
// HELPER: Handle Subscription Change
// ============================================================

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID in subscription');
    return;
  }

  // Find user by Stripe customer ID
  // Note: You'll need to store stripeCustomerId on User model
  // For now, using metadata.userId if set during checkout
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Determine new plan
  const newPlan = PRICE_TO_PLAN[priceId] || PlanTier.FREE;
  const previousPlan = user.plan;

  if (newPlan === previousPlan) {
    return; // No change
  }

  const isUpgrade = getPlanLevel(newPlan) > getPlanLevel(previousPlan);

  // Update user plan with audit log
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { plan: newPlan },
    });

    await tx.auditLog.create({
      data: {
        action: isUpgrade ? AuditAction.PLAN_UPGRADED : AuditAction.PLAN_DOWNGRADED,
        entityType: AuditEntityType.SUBSCRIPTION,
        entityId: subscription.id,
        performedByUserId: null, // System action
        metadata: {
          userId,
          email: user.email,
          previousPlan,
          newPlan,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          source: 'stripe-webhook',
        },
      },
    });
  });

  console.log(`User ${user.email} plan changed: ${previousPlan} → ${newPlan}`);
}

// ============================================================
// HELPER: Handle Subscription Canceled
// ============================================================

async function handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  const previousPlan = user.plan;

  // Downgrade to FREE
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { plan: PlanTier.FREE },
    });

    await tx.auditLog.create({
      data: {
        action: AuditAction.PLAN_DOWNGRADED,
        entityType: AuditEntityType.SUBSCRIPTION,
        entityId: subscription.id,
        performedByUserId: null,
        metadata: {
          userId,
          email: user.email,
          previousPlan,
          newPlan: PlanTier.FREE,
          stripeSubscriptionId: subscription.id,
          reason: 'subscription_canceled',
          source: 'stripe-webhook',
        },
      },
    });
  });

  console.log(`User ${user.email} subscription canceled, downgraded to FREE`);
}

// ============================================================
// HELPER: Get Plan Level
// ============================================================

function getPlanLevel(plan: PlanTier): number {
  const levels: Record<PlanTier, number> = {
    [PlanTier.FREE]: 0,
    [PlanTier.PRO]: 1,
    [PlanTier.ENTERPRISE]: 2,
  };
  return levels[plan];
}

export default router;