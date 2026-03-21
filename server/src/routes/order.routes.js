import express from 'express';
import { body } from 'express-validator';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getUserOrders,
  cancelOrder,
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

// Order validation rules
const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shipping_address')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
];

const statusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

// Routes
router.get('/', authenticate, authorize('admin'), getOrders);
router.get('/my-orders', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, orderValidation, handleValidationErrors, createOrder);
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  statusValidation,
  handleValidationErrors,
  updateOrderStatus
);
router.patch('/:id/cancel', authenticate, cancelOrder);

export default router;

