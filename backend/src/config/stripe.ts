// src/config/stripe.ts

import Stripe from 'stripe';
import { config } from './env';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.apiVersion as Stripe.LatestApiVersion,
});

export default stripe;

