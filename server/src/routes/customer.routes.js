import express from 'express';
import { getCustomerDashboardStats } from '../controllers/customer.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get customer dashboard statistics
router.get('/customer/dashboard/stats', authenticate, getCustomerDashboardStats);

export default router;

