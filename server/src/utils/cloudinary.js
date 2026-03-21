import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} folder - Folder path in Cloudinary
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadImage = async (file, folder = 'products', publicId = null) => {
  try {
    const uploadOptions = {
      folder: process.env.CLOUDINARY_ASSET_FOLDER 
        ? `${process.env.CLOUDINARY_ASSET_FOLDER}/${folder}` 
        : folder,
      resource_type: 'image',
      overwrite: true,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // If file is a buffer, convert to base64
    let fileData = file;
    if (Buffer.isBuffer(file)) {
      fileData = `data:image/jpeg;base64,${file.toString('base64')}`;
    }

    const result = await cloudinary.uploader.upload(fileData, uploadOptions);
    
    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      return { result: 'ok' };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw - image might already be deleted
    return { result: 'not_found' };
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} Public ID or null
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    
    // Reconstruct full path
    const folderIndex = url.indexOf('/upload/') + 8;
    const pathAfterUpload = url.substring(folderIndex);
    const fullPath = pathAfterUpload.split('.')[0];
    
    return fullPath;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

export default cloudinary;

