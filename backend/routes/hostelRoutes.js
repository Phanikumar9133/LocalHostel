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

const Hostel = require('../models/Hostel');

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES - no auth required
// ────────────────────────────────────────────────────────────────────────────────
router.get('/', getAllHostels);
router.get('/:id', getHostelById);

// ────────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES - only authenticated owners
// ────────────────────────────────────────────────────────────────────────────────

// Create hostel
router.post('/', protect, ownerOnly, uploadHostelImages, createHostel);

// Update hostel
router.put('/:id', protect, ownerOnly, uploadHostelImages, updateHostel);

// Delete hostel
router.delete('/:id', protect, ownerOnly, deleteHostel);

// ────────────────────────────────────────────────────────────────────────────────
// MY HOSTELS - FIXED & DEBUG-ENHANCED VERSION
// Always returns 200 + JSON (even when empty)
// ────────────────────────────────────────────────────────────────────────────────
// Get my hostels - ultra-safe version with maximum debug output
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    // 1. Log raw user from middleware
    console.log('[MY-HOSTELS] ==========================================');
    console.log('[MY-HOSTELS] req.user raw:', JSON.stringify(req.user, null, 2));
    console.log('[MY-HOSTELS] req.user._id type:', typeof req.user._id, req.user._id instanceof mongoose.Types.ObjectId ? 'ObjectId' : 'NOT ObjectId');

    const ownerId = req.user._id;

    // 2. Validate ID format early
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.log('[MY-HOSTELS] INVALID OWNER ID FORMAT:', ownerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID in token',
        detail: 'Owner ID is not a valid ObjectId'
      });
    }

    console.log('[MY-HOSTELS] Querying hostels where owner =', ownerId.toString());

    // 3. Simple count first (fastest way to check)
    const count = await Hostel.countDocuments({ owner: ownerId });
    console.log('[MY-HOSTELS] countDocuments returned:', count);

    // 4. Full find if needed
    const hostels = await Hostel.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log('[MY-HOSTELS] find() returned documents:', hostels.length);

    if (hostels.length > 0) {
      console.log('[MY-HOSTELS] First document owner ID:', hostels[0].owner?.toString());
      console.log('[MY-HOSTELS] First document _id:', hostels[0]._id.toString());
    } else {
      console.log('[MY-HOSTELS] No documents matched this owner ID');
    }

    return res.status(200).json({
      success: true,
      count: hostels.length,
      hostels,
      debug: {
        ownerIdUsed: ownerId.toString(),
        countDocumentsResult: count,
        findResultLength: hostels.length
      }
    });
  } catch (error) {
    console.error('[MY-HOSTELS] CRITICAL ERROR:');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack?.substring(0, 800) || 'no stack available');

    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching your hostels',
      errorType: error.name,
      errorMessage: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;