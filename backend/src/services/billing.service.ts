import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
};

export const billingService = {
  async getOrCreateStripeCustomer(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });

    // Save customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  },

  async getBillingInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    let currentPlan = PLANS.free;
    let subscription = null;
    const invoices: any[] = [];

    if (user.stripeCustomerId) {
      // Get active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        subscription = subscriptions.data[0];
        const priceId = subscription.items.data[0]?.price.id;

        // Determine plan from price ID
        if (priceId === process.env.STRIPE_PRICE_PRO) {
          currentPlan = PLANS.pro;
        } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
          currentPlan = PLANS.enterprise;
        }
      }

      // Get recent invoices
      const stripeInvoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 10,
      });

      for (const inv of stripeInvoices.data) {
        invoices.push({
          id: inv.id,
          date: new Date(inv.created * 1000).toLocaleDateString(),
          amount: (inv.amount_paid / 100).toFixed(2),
          status: inv.status,
          pdfUrl: inv.invoice_pdf,
        });
      }
    }

    return {
      currentPlan,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
      invoices,
    };
  },

  async createCheckoutSession(userId: string, priceId: string, successUrl?: string, cancelUrl?: string) {
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${baseUrl}/billing?success=true`,
      cancel_url: cancelUrl || `${baseUrl}/billing?canceled=true`,
      metadata: { userId },
    });

    return { sessionId: session.id, url: session.url };
  },

  async createPortalSession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new BadRequestError('No billing account found');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return { url: session.url };
  },

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err });
      throw new BadRequestError('Invalid webhook signature');
    }

    logger.info(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info('Invoice paid', { invoiceId: invoice.id, customerId: invoice.customer });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn('Invoice payment failed', { invoiceId: invoice.id, customerId: invoice.customer });
        break;
      }

      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true };
  },

  async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) {
      logger.warn('Checkout session missing userId metadata');
      return;
    }

    // Update user role to SUBSCRIBER
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SUBSCRIBER' },
    });

    logger.info('User upgraded to subscriber', { userId });
  },

  async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      logger.warn('User not found for subscription update', { customerId });
      return;
    }

    // Update role based on subscription status
    const role = subscription.status === 'active' ? 'SUBSCRIBER' : 'USER';
    await prisma.user.update({
      where: { id: user.id },
      data: { role },
    });

    logger.info('Subscription updated', { userId: user.id, status: subscription.status });
  },

  async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      logger.warn('User not found for subscription cancel', { customerId });
      return;
    }

    // Downgrade to free user
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'USER' },
    });

    logger.info('Subscription canceled, user downgraded', { userId: user.id });
  },

  getPlans() {
    return Object.values(PLANS);
  },
};

export default billingService;
