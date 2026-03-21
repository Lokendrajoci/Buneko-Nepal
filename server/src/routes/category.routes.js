import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

// Category validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

// Routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  categoryValidation,
  handleValidationErrors,
  createCategory
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  categoryValidation,
  handleValidationErrors,
  updateCategory
);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;

