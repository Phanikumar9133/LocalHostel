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
// PUBLIC ROUTES - Anyone can access these (no auth required)
// ────────────────────────────────────────────────────────────────────────────────
router.get('/', getAllHostels);              // List all hostels (public)
router.get('/:id', getHostelById);           // Get single hostel by ID (public)

// ────────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES - Only authenticated owners
// ────────────────────────────────────────────────────────────────────────────────

// Create hostel (with image upload)
router.post('/', protect, ownerOnly, uploadHostelImages, createHostel);

// Update hostel (with optional new images)
router.put('/:id', protect, ownerOnly, uploadHostelImages, updateHostel);

// Delete hostel
router.delete('/:id', protect, ownerOnly, deleteHostel);

// ────────────────────────────────────────────────────────────────────────────────
// OWNER-SPECIFIC PROTECTED ROUTE: Get ONLY this owner's hostels
// This is the route your frontend dashboard should call: /api/hostels/my-hostels
// ────────────────────────────────────────────────────────────────────────────────
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    // 1. Safety check - ensure authenticated user
    if (!req.user || !req.user._id) {
      console.log('[HOSTEL MY] No authenticated user in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - please login again'
      });
    }

    const ownerIdString = req.user._id.toString();
    console.log(`[HOSTEL MY] Fetching hostels for owner: ${ownerIdString}`);

    // 2. Convert string ID to ObjectId (critical fix for matching)
    let ownerObjectId;
    try {
      ownerObjectId = new mongoose.Types.ObjectId(ownerIdString);
    } catch (idErr) {
      console.error('[HOSTEL MY] Invalid owner ID format:', idErr.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid owner ID format'
      });
    }

    // 3. Query hostels - use ObjectId for correct matching
    const hostels = await Hostel.find({ owner: ownerObjectId })
      .sort({ createdAt: -1 })     // newest first
      .lean();                     // faster + plain objects

    console.log(`[HOSTEL MY] Found ${hostels.length} hostels for owner ${ownerIdString}`);

    // Optional: log basic info for debugging (remove in production if too verbose)
    if (hostels.length > 0) {
      console.log('[HOSTEL MY] First hostel:', {
        id: hostels[0]._id,
        name: hostels[0].name,
        owner: hostels[0].owner?.toString(),
        seats: hostels[0].availableSeats
      });
    }

    // 4. Send clean, consistent response
    return res.status(200).json({
      success: true,
      count: hostels.length,
      hostels
    });
  } catch (error) {
    console.error('[HOSTEL MY] CRASH:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    });

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your hostels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;