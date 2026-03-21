import express from 'express';
import { body } from 'express-validator';
import {
  getUserCustomizations,
  getAllCustomizations,
  getCustomizationById,
  createCustomization,
  updateCustomizationStatus,
  createOrderFromCustomization,
  completeCustomizationOrder,
} from '../controllers/customization.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

// Validation rules
const customizationValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('type')
    .optional()
    .isIn(['bouquet', 'flower', 'arrangement', 'other'])
    .withMessage('Invalid type'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('delivery_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

const statusValidation = [
  body('status')
    .isIn(['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed'])
    .withMessage('Invalid status'),
  body('quoted_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quoted price must be a positive number'),
];

// Routes
router.get('/my-customizations', authenticate, getUserCustomizations);
router.get('/', authenticate, authorize('admin'), getAllCustomizations);
router.get('/:id', authenticate, getCustomizationById);
router.post('/', authenticate, customizationValidation, handleValidationErrors, createCustomization);
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  statusValidation,
  handleValidationErrors,
  updateCustomizationStatus
);

// Create order from accepted customization (admin)
router.post(
  '/:id/create-order',
  authenticate,
  authorize('admin'),
  [
    body('shipping_address').trim().notEmpty().withMessage('Shipping address is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
  ],
  handleValidationErrors,
  createOrderFromCustomization
);

// Complete customization order (user) - add payment and delivery details
router.post(
  '/:id/complete-order',
  authenticate,
  [
    body('shipping_address').trim().notEmpty().withMessage('Shipping address is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('payment_status').optional().isIn(['pending', 'paid']).withMessage('Invalid payment status'),
  ],
  handleValidationErrors,
  completeCustomizationOrder
);

export default router;

