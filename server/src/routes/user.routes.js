import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  toggleUserStatus,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../utils/validation.js';
import { upload, uploadToCloudinary } from '../middleware/upload.middleware.js';

const router = express.Router();

// User update validation
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
];

// Password change validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

// Routes
// Allow both admin and customers to get users (customers see only other customers)
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);
router.put(
  '/profile',
  authenticate,
  upload.single('profile_image'),
  uploadToCloudinary,
  updateUserValidation,
  handleValidationErrors,
  updateProfile
);
router.put(
  '/profile/password',
  authenticate,
  changePasswordValidation,
  handleValidationErrors,
  changePassword
);
router.put('/:id', authenticate, authorize('admin'), updateUserValidation, handleValidationErrors, updateUser);
router.patch('/:id/status', authenticate, authorize('admin', 'superadmin'), toggleUserStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;

