import express from 'express';
import { body } from 'express-validator';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

const addValidation = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product_id is required'),
];

// Current user's wishlist
router.get('/', authenticate, getWishlist);

// Add product to wishlist
router.post(
  '/',
  authenticate,
  addValidation,
  handleValidationErrors,
  addToWishlist
);

// Remove product from wishlist
router.delete('/:productId', authenticate, removeFromWishlist);

export default router;


