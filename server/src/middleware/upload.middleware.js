import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFileExtension = (file) => {
  const mimeExtension = file?.mimetype?.split('/')?.[1];
  const originalExt = file?.originalname ? path.extname(file.originalname) : '';
  return originalExt || (mimeExtension ? `.${mimeExtension}` : '.jpg');
};

const saveImageLocally = async (file, folder = 'products') => {
  const uploadRoot = path.resolve(__dirname, '../../uploads');
  const destinationDir = path.join(uploadRoot, folder);
  await fs.mkdir(destinationDir, { recursive: true });

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${getFileExtension(file)}`;
  const absolutePath = path.join(destinationDir, filename);

  await fs.writeFile(absolutePath, file.buffer);

  return {
    relativePath: `/uploads/${folder}/${filename}`,
    filename,
  };
};

// Middleware to upload image to local storage
export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      // If no file, continue without image
      return next();
    }

    // Determine folder based on field name or route
    const folder = req.file.fieldname === 'profile_image' ? 'profiles' : 'products';
    const localFile = await saveImageLocally(req.file, folder);
    const localUrl = `${req.protocol}://${req.get('host')}${localFile.relativePath}`;

    // Attach image URL to request body based on field name
    if (req.file.fieldname === 'profile_image') {
      req.body.profile_image_url = localUrl;
    } else {
      req.body.image_url = localUrl;
    }
    req.body.image_public_id = null;

    next();
  } catch (error) {
    console.error('Local upload middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};

