import { Router } from 'express';
import { adminController } from '../controllers';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { updateUserSchema } from '../schemas';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// User management
router.get(
  '/users',
  asyncHandler(adminController.getUsers)
);

router.get(
  '/users/:id',
  asyncHandler(adminController.getUserById)
);

router.put(
  '/users/:id',
  validate(updateUserSchema),
  asyncHandler(adminController.updateUser)
);

router.delete(
  '/users/:id',
  asyncHandler(adminController.deleteUser)
);

// Dashboard stats
router.get(
  '/stats',
  asyncHandler(adminController.getStats)
);

export default router;
