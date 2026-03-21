import express from 'express';
import { body, query } from 'express-validator';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';
import { upload, uploadToCloudinary } from '../middleware/upload.middleware.js';

const router = express.Router();

// Product validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
];

// Routes
router.get('/', getProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  uploadToCloudinary,
  productValidation,
  handleValidationErrors,
  createProduct
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  uploadToCloudinary,
  productValidation,
  handleValidationErrors,
  updateProduct
);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;

