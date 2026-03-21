const express = require('express');
const mongoose = require('mongoose');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');

const router = express.Router();

// ────────────────────────────────────────────────────────────────────────────────
// Create a new booking (student only)
// ────────────────────────────────────────────────────────────────────────────────
router.post('/', protect, createBooking);

// ────────────────────────────────────────────────────────────────────────────────
// Get my bookings (student)
// ────────────────────────────────────────────────────────────────────────────────
router.get('/user', protect, getUserBookings);

// ────────────────────────────────────────────────────────────────────────────────
// Get all bookings for my hostels (owner only) - FIXED with ObjectId conversion
// ────────────────────────────────────────────────────────────────────────────────
router.get('/owner', protect, ownerOnly, async (req, res) => {
  try {
    // 1. Safety check
    if (!req.user || !req.user._id) {
      console.log('[BOOKING OWNER] No authenticated user in request');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const ownerIdStr = req.user._id.toString();
    console.log(`[BOOKING OWNER] Fetching bookings for owner: ${ownerIdStr}`);

    // 2. Convert string → ObjectId
    let ownerObjectId;
    try {
      ownerObjectId = new mongoose.Types.ObjectId(ownerIdStr);
    } catch (idErr) {
      console.error('[BOOKING OWNER] Invalid owner ID:', idErr.message);
      return res.status(400).json({ success: false, message: 'Invalid owner ID' });
    }

    // 3. Find owned hostels
    const ownedHostels = await Hostel.find({ owner: ownerObjectId })
      .select('_id')
      .lean();

    const hostelIds = ownedHostels.map(h => h._id);
    console.log(`[BOOKING OWNER] Owner controls ${hostelIds.length} hostels`);

    if (hostelIds.length === 0) {
      console.log('[BOOKING OWNER] No hostels found → returning empty');
      return res.json({ success: true, count: 0, bookings: [] });
    }

    // 4. Fetch bookings
    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')
      .populate('hostel', 'name location type')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[BOOKING OWNER] Found ${bookings.length} bookings`);

    return res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('[BOOKING OWNER] CRASH:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    });

    return res.status(500).json({
      success: false,
      message: 'Server error fetching owner bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// Update booking status (accept/reject)
// ────────────────────────────────────────────────────────────────────────────────
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

module.exports = router;