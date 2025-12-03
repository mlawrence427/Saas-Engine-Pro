import { Router } from 'express';
import { authController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas';

const router = Router();

// Public routes
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

// Protected routes
router.get(
  '/me',
  requireAuth,
  asyncHandler(authController.me)
);

router.put(
  '/profile',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);

router.put(
  '/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(authController.logout)
);

export default router;
