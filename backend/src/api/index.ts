import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import billingRoutes from './billing.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/billing', billingRoutes);
router.use('/admin', adminRoutes);

export default router;
