// routes/bookingRoutes.js
const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,           // ← assuming you export this
  updateBookingStatus,
} = require('../controllers/bookingController');

const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/user', protect, getUserBookings);

// FIXED /owner route – use req.user._id directly
router.get('/owner', protect, ownerOnly, async (req, res) => {
  try {
    const ownerId = req.user._id;
    console.log(`[BOOKING OWNER] Fetching for owner: ${ownerId}`);

    // Find all hostels owned by this user
    const myHostels = await Hostel.find({ owner: ownerId })
      .select('_id')
      .lean();

    const hostelIds = myHostels.map(h => h._id);

    console.log(`[BOOKING OWNER] Owner controls ${myHostels.length} hostels → ${hostelIds.length} IDs`);

    if (hostelIds.length === 0) {
      return res.json({ success: true, count: 0, bookings: [] });
    }

    // Fetch bookings only for those hostels
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
    console.error('[BOOKING OWNER] ERROR:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500) || 'no stack'
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch owner bookings',
      errorType: error.name,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

module.exports = router;