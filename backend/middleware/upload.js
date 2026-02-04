const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostelhub',
    allowed_formats: [
      'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif',
      'svg', 'avif', 'heic', 'heif', 'ico'
    ],
    transformation: [
      { width: 1200, height: 900, crop: 'limit' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
      { flags: 'lossy' }
    ],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 6,
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|bmp|tiff|tif|svg|svg\+xml|ico|heic|heif|avif/i;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(require('path').extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed! Supported: JPG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF, HEIC, ICO'));
  },
});

const uploadHostelImages = upload.array('images', 6);

module.exports = uploadHostelImages;