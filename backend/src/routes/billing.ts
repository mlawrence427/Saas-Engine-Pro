// ============================================================
// backend/src/routes/billing.ts - SaaS Engine Pro
// Billing & Subscription Routes
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { config } from '../config/env';
import { checkoutSchema } from '../utils/validation';
import { 
  fromZodError, 
  notFoundError, 
  serviceUnavailableError,
} from '../utils/errors';
import { PlanTier } from '@prisma/client';

const router = Router();

// ============================================================
// STRIPE CONFIGURATION
// ============================================================

const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey, { apiVersion: '2024-04-10' })
  : null;

// Plan to Stripe Price ID mapping
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  PRO: config.stripe.prices.pro,
  ENTERPRISE: config.stripe.prices.enterprise,
};

// ============================================================
// TYPES
// ============================================================

interface BillingInfo {
  plan: PlanTier;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'free';
  currentPeriodEnd: string | null;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

// ============================================================
// GET /api/billing
// Get current user's billing/subscription info
// ============================================================

router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          plan: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      // Base billing info for free users
      const billingInfo: BillingInfo = {
        plan: user.plan,
        status: user.plan === PlanTier.FREE ? 'free' : 'active',
        currentPeriodEnd: null,
        renewsAt: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
      };

      // If user has a paid plan and Stripe is configured, fetch real subscription data
      if (stripe && user.plan !== PlanTier.FREE) {
        try {
          // Search for customer by email
          const customers = await stripe.customers.list({
            email: user.email,
            limit: 1,
          });

          if (customers.data.length > 0) {
            const customer = customers.data[0];
            billingInfo.stripeCustomerId = customer.id;

            // Get active subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'all',
              limit: 1,
            });

            if (subscriptions.data.length > 0) {
              const subscription = subscriptions.data[0];
              
              billingInfo.status = subscription.status as BillingInfo['status'];
              billingInfo.currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
              billingInfo.renewsAt = subscription.cancel_at_period_end 
                ? null 
                : new Date(subscription.current_period_end * 1000).toISOString();
              billingInfo.cancelAtPeriodEnd = subscription.cancel_at_period_end;
            }
          }
        } catch (stripeError) {
          console.error('Stripe fetch error:', stripeError);
          // Continue with basic billing info if Stripe fails
        }
      }

      res.status(200).json({
        success: true,
        data: billingInfo,
      });

    } catch (error) {
      console.error('Get billing error:', error);
      res.status(500).json({
        success: false,
        error: 'BillingFetchFailed',
        message: 'Failed to fetch billing information',
      });
    }
  }
);

// ============================================================
// POST /api/billing/portal
// Create Stripe Customer Portal session
// ============================================================

router.post(
  '/portal',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'StripeNotConfigured',
        message: 'Billing is not available at this time',
      });
      return;
    }

    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          plan: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      // Find or create Stripe customer
      let customerId: string;

      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;
      }

      // Create portal session
      const returnUrl = process.env.FRONTEND_URL 
        ? `${process.env.FRONTEND_URL}/account/billing`
        : 'http://localhost:3000/account/billing';

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      res.status(200).json({
        success: true,
        data: {
          url: portalSession.url,
        },
      });

    } catch (error) {
      console.error('Create portal session error:', error);
      res.status(500).json({
        success: false,
        error: 'PortalSessionFailed',
        message: 'Failed to create billing portal session',
      });
    }
  }
);

// ============================================================
// POST /api/billing/checkout
// Create Stripe Checkout session for plan upgrade
// ============================================================

router.post(
  '/checkout',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    if (!stripe) {
      res.status(503).json({
        success: false,
        error: 'StripeNotConfigured',
        message: 'Billing is not available at this time',
      });
      return;
    }

    const { plan } = req.body;

    if (!plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
      res.status(400).json({
        success: false,
        error: 'InvalidPlan',
        message: 'Invalid plan. Must be PRO or ENTERPRISE',
      });
      return;
    }

    const priceId = PLAN_PRICE_IDS[plan];

    if (!priceId) {
      res.status(503).json({
        success: false,
        error: 'PriceNotConfigured',
        message: `Price for ${plan} plan is not configured`,
      });
      return;
    }

    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          plan: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'UserNotFound',
          message: 'User not found',
        });
        return;
      }

      // Find or create Stripe customer
      let customerId: string;

      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;
      }

      // Create checkout session
      const successUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/account/billing?success=true`
        : 'http://localhost:3000/account/billing?success=true';

      const cancelUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/account/billing?canceled=true`
        : 'http://localhost:3000/account/billing?canceled=true';

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          url: checkoutSession.url,
        },
      });

    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(500).json({
        success: false,
        error: 'CheckoutSessionFailed',
        message: 'Failed to create checkout session',
      });
    }
  }
);

export default router;