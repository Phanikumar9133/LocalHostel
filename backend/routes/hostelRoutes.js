// routes/hostelRoutes.js
const express = require('express');
const mongoose = require('mongoose');
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

// ────────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ────────────────────────────────────────────────────────────────────────────────
router.get('/', getAllHostels);
router.get('/:id', getHostelById);

// ────────────────────────────────────────────────────────────────────────────────
// PROTECTED – OWNER ONLY
// ────────────────────────────────────────────────────────────────────────────────
router.post('/', protect, ownerOnly, uploadHostelImages, createHostel);
router.put('/:id', protect, ownerOnly, uploadHostelImages, updateHostel);
router.delete('/:id', protect, ownerOnly, deleteHostel);

// Get my hostels – FIXED VERSION
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    const ownerId = req.user._id;

    console.log(`[HOSTEL MY] Fetching hostels for owner: ${ownerId}`);

    const hostels = await Hostel.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[HOSTEL MY] Found ${hostels.length} hostels`);

    // Optional: minimal debug of first hostel
    if (hostels.length > 0) {
      console.log('[HOSTEL MY] First hostel sample:', {
        _id: hostels[0]._id.toString(),
        name: hostels[0].name,
        owner: hostels[0].owner.toString(),
        availableSeats: hostels[0].availableSeats
      });
    }

    return res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    console.error('[HOSTEL MY] ERROR:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500) || 'no stack'
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your hostels',
      errorType: error.name,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;