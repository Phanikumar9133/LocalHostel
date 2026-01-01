// middleware/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your actual credentials
cloudinary.config({
  cloud_name: 'ducj18p7q',
  api_key: '696345625921575',
  api_secret: 'J7JTXdyvxZYdUSshUDAxr02rQHs',
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hostelhub',                    // Images will be organized in this folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1000, height: 800, crop: 'limit' },  // Prevents huge uploads
      { quality: 'auto' },                           // Optimizes quality
      { fetch_format: 'auto' }                       // Serves WebP when supported
    ],
  },
});

// Multer configuration with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file (same as before)
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(require('path').extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed! (jpeg, jpg, png, webp)'));
  },
});

// Allow up to 6 images
const uploadHostelImages = upload.array('images', 6);

module.exports = uploadHostelImages;