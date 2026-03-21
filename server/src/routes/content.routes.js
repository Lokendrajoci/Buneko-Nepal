import express from 'express';
import { body } from 'express-validator';
import {
  getContents,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
} from '../controllers/content.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

const contentValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
];

// Public list endpoint for showing TikTok content on frontend
router.get('/', getContents);

// Admin/superadmin endpoints
router.get('/:id', authenticate, authorize('admin', 'superadmin'), getContentById);
router.post(
  '/',
  authenticate,
  authorize('admin', 'superadmin'),
  contentValidation,
  handleValidationErrors,
  createContent
);
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  contentValidation,
  handleValidationErrors,
  updateContent
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'superadmin'),
  deleteContent
);

export default router;


