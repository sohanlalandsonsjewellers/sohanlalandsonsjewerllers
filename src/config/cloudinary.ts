import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// 1. Cloudinary SDK Connection
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Storage Strategy Layout Optimization Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'luxe_jewellery_products',
      format: 'webp', // 🚀 Force WebP for super fast CDN loads automatically
      transformation: [{ quality: 'auto:good', width: 1200, crop: 'limit' }], // Quality safeguards
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
    };
  },
});

// 3. Multer Middleware Generator Export
export const uploadCloudinary = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB raw image input limit before optimization
});

export { cloudinary };