import multer from 'multer';
import { uploadImage } from '../utils/cloudinary.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to upload image to Cloudinary
export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      // If no file, continue without image
      return next();
    }

    // Determine folder based on field name or route
    const folder = req.file.fieldname === 'profile_image' ? 'profiles' : 'products';

    // Upload to Cloudinary
    const result = await uploadImage(
      req.file.buffer,
      folder,
      null
    );

    // Attach image URL to request body based on field name
    if (req.file.fieldname === 'profile_image') {
      req.body.profile_image_url = result.url;
    } else {
      req.body.image_url = result.url;
    }
    req.body.image_public_id = result.public_id;

    next();
  } catch (error) {
    console.error('Cloudinary upload middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};

