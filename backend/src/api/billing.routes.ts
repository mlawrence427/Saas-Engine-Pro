import { Router } from 'express';
import { billingController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { createCheckoutSchema } from '../schemas';

const router = Router();

// Get available plans (public)
router.get(
  '/plans',
  asyncHandler(billingController.getPlans)
);

// Protected routes
router.get(
  '/',
  requireAuth,
  asyncHandler(billingController.getBilling)
);

router.post(
  '/checkout',
  requireAuth,
  validate(createCheckoutSchema),
  asyncHandler(billingController.createCheckout)
);

router.post(
  '/portal',
  requireAuth,
  asyncHandler(billingController.createPortal)
);

export default router;
