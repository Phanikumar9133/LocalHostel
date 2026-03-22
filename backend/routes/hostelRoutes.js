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
    const ownerId = req.user._id;

    console.log('[MY-HOSTELS] Owner querying:', ownerId.toString());

    const hostels = await Hostel.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log('[MY-HOSTELS] Found:', hostels.length);

    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    console.error('[MY-HOSTELS ERROR]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your hostels',
      error: error.message
    });
  }
});

module.exports = router;