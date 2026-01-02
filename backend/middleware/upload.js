// middleware/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'ducj18p7q',
  api_key: '696345625921575',
  api_secret: 'J7JTXdyvxZYdUSshUDAxr02rQHs',
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostelhub',
    // Allow ALL common image formats (Cloudinary supports most)
    allowed_formats: [
      'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif',
      'svg', 'avif', 'heic', 'heif', 'ico'
    ],
    transformation: [
      { width: 1200, height: 900, crop: 'limit' },  // Prevent oversized uploads
      { quality: 'auto:best' },                     // Best quality auto-optimization
      { fetch_format: 'auto' },                     // Serve WebP/AVIF when supported
      { flags: 'lossy' }                            // Enable compression
    ],
  },
});

// Multer configuration with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB per file (safe for high-res images)
    files: 6,                   // Max 6 images
  },
  fileFilter: (req, file, cb) => {
    // Comprehensive regex for all image types
    const filetypes = /jpeg|jpg|png|gif|webp|bmp|tiff|tif|svg|svg\+xml|ico|heic|heif|avif/i;
    
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(require('path').extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Error: Only image files are allowed! Supported: JPG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF, HEIC, ICO'));
  },
});

// Allow up to 6 images
const uploadHostelImages = upload.array('images', 6);

module.exports = uploadHostelImages;