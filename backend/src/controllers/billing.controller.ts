import { Request, Response } from 'express';
import { billingService } from '../services';
import { successResponse } from '../utils/types';
import { AuthenticatedRequest } from '../utils/types';

export const billingController = {
  async getBilling(req: AuthenticatedRequest, res: Response) {
    const billing = await billingService.getBillingInfo(req.user!.id);
    res.json(successResponse(billing));
  },

  async getPlans(req: Request, res: Response) {
    const plans = billingService.getPlans();
    res.json(successResponse(plans));
  },

  async createCheckout(req: AuthenticatedRequest, res: Response) {
    const { priceId, successUrl, cancelUrl } = req.body;
    const session = await billingService.createCheckoutSession(
      req.user!.id,
      priceId,
      successUrl,
      cancelUrl
    );
    res.json(successResponse(session));
  },

  async createPortal(req: AuthenticatedRequest, res: Response) {
    const session = await billingService.createPortalSession(req.user!.id);
    res.json(successResponse(session));
  },

  async handleWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    const result = await billingService.handleWebhook(req.body, signature);
    res.json(result);
  },
};

export default billingController;
