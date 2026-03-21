import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/stats', authenticate, authorize('admin'), getDashboardStats);

export default router;

