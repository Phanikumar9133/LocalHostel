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
router.get('/my-hostels', protect, ownerOnly, async (req, res) => {
  try {
    const ownerId = req.user._id;

    // ────────────────────────────── DEBUG LOGS ──────────────────────────────
    console.log('══════════════════════════════════════════════════════════════');
    console.log('[MY-HOSTELS] Request from user:');
    console.log('  • User _id (ObjectId):', ownerId.toString());
    console.log('  • User email:', req.user.email || 'missing');
    console.log('  • User role:', req.user.role);
    console.log('══════════════════════════════════════════════════════════════');

    // Count first (faster than full find)
    const count = await Hostel.countDocuments({ owner: ownerId });
    console.log('[MY-HOSTELS] countDocuments result:', count);

    const hostels = await Hostel.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    console.log('[MY-HOSTELS] find() returned:', hostels.length, 'documents');

    if (hostels.length > 0) {
      console.log('[MY-HOSTELS] First hostel sample:');
      console.log('  • _id:', hostels[0]._id.toString());
      console.log('  • name:', hostels[0].name);
      console.log('  • owner:', hostels[0].owner?.toString());
    } else {
      console.log('[MY-HOSTELS] No matching hostels found for this owner ID');
    }

    // ALWAYS return JSON - never 204
    res.status(200).json({
      success: true,
      count: hostels.length,
      hostels: hostels || [],
      debugInfo: {
        queriedOwnerId: ownerId.toString(),
        mongoCount: count,
        foundLength: hostels.length
      }
    });
  } catch (error) {
    console.error('[MY-HOSTELS] CRASH:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 600) || 'no stack'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch your hostels',
      errorType: error.name,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;