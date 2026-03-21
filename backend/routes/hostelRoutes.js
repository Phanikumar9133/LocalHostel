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

// Public routes - anyone can see all hostels or specific one
router.get('/', getAllHostels);
router.get('/:id', getHostelById);

// Protected routes - only authenticated owners
router.post('/', protect, ownerOnly, uploadHostelImages, createHostel);
router.put('/:id', protect, ownerOnly, uploadHostelImages, updateHostel);
router.delete('/:id', protect, ownerOnly, deleteHostel);

// IMPORTANT: Owner-specific route to get ONLY their own hostels
// This is what your frontend dashboard calls (/api/hostels with auth)
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    console.log(`[HOSTEL ROUTE] Fetching hostels for owner: ${req.user._id}`);

    const hostels = await Hostel.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    console.log(`[HOSTEL ROUTE] Found ${hostels.length} hostels for this owner`);

    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    console.error('[HOSTEL ROUTE] Error fetching my hostels:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your hostels'
    });
  }
});

module.exports = router;