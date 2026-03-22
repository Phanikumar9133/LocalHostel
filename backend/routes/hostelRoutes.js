// routes/hostelRoutes.js
const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel
} = require('../controllers/hostelController');
const uploadHostelImages = require('../middleware/upload');

const router = express.Router();

// PUBLIC ROUTES (no auth)
router.get('/', getAllHostels);                    // GET /api/hostels
router.get('/:id', getHostelById);                 // GET /api/hostels/:id   ← must come AFTER /my-hostels

// PROTECTED OWNER ROUTES
router.post('/', protect, ownerOnly, uploadHostelImages, createHostel);
router.put('/:id', protect, ownerOnly, uploadHostelImages, updateHostel);
router.delete('/:id', protect, ownerOnly, deleteHostel);

// SPECIAL ROUTE - MY HOSTELS (must be BEFORE /:id to avoid conflict)
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    console.log('=== MY-HOSTELS ROUTE HIT ===');
    console.log('User ID:', req.user._id.toString());
    console.log('Email:', req.user.email || 'missing');

    const ownerId = req.user._id;

    // Quick count check
    const count = await Hostel.countDocuments({ owner: ownerId });
    console.log('MongoDB countDocuments:', count);

    // Full query
    const hostels = await Hostel.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log('Hostels found:', hostels.length);

    // Always send response - no way to miss it
    return res.status(200).json({
      success: true,
      count: hostels.length,
      hostels: hostels || [],
      debug: {
        ownerId: ownerId.toString(),
        mongoCount: count,
        foundLength: hostels.length
      }
    });
  } catch (error) {
    console.error('MY-HOSTELS CRASH:');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Stack trace:', error.stack?.substring(0, 800) || 'no stack');

    return res.status(500).json({
      success: false,
      message: 'Failed to load your hostels',
      errorType: error.name,
      errorDetail: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

module.exports = router;