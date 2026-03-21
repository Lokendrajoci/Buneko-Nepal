import express from 'express';
import { body } from 'express-validator';
import { createCheckoutSession } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

const checkoutValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items array is required'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product_id is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

router.post(
  '/create-checkout-session',
  authenticate,
  checkoutValidation,
  handleValidationErrors,
  createCheckoutSession
);

export default router;


