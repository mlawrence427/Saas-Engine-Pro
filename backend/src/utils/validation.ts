// src/utils/validation.ts
import { z } from 'zod';

/**
 * Schema for creating a Stripe Checkout session.
 * Used by billing routes.
 */
export const checkoutSchema = z.object({
  priceId: z.string().min(1, 'priceId is required'),
  successUrl: z.string().url('successUrl must be a valid URL'),
  cancelUrl: z.string().url('cancelUrl must be a valid URL'),
});

// Export a namespace-style object in case old code does `validation.checkoutSchema`
export const validation = {
  checkoutSchema,
};
