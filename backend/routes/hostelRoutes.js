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
    // Log everything early
    console.log('MY-HOSTELS START =====================================');
    console.log('User ID from token:', req.user._id.toString());
    console.log('User role:', req.user.role);
    console.log('Model loaded:', !!Hostel); // true if model exists

    const ownerId = req.user._id;

    // Validate ID (prevents cast error)
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.log('Invalid owner ID format');
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Use simple query – no complex options
    const hostels = await Hostel.find({ owner: ownerId }).lean();

    console.log('MY-HOSTELS FOUND:', hostels.length);

    return res.status(200).json({
      success: true,
      count: hostels.length,
      hostels: hostels || [],
      debug: {
        ownerId: ownerId.toString(),
        foundCount: hostels.length
      }
    });
  } catch (error) {
    console.error('MY-HOSTELS CRASH =====================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack?.substring(0, 800) || 'no stack');

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your hostels',
      errorType: error.name,
      errorDetail: error.message
    });
  } finally {
    console.log('MY-HOSTELS END =====================================');
  }
});

module.exports = router;