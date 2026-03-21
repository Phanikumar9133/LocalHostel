// routes/bookingRoutes.js
const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');

const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');

const router = express.Router();

// Student creates booking
router.post('/', protect, createBooking);

// Student sees own bookings
router.get('/user', protect, getUserBookings);

// Owner sees bookings for THEIR hostels - FIXED & DEBUG VERSION
router.get('/owner', protect, ownerOnly, async (req, res) => {
  try {
    const ownerId = req.user._id;

    console.log('══════════════════════════════════════════════════════════════');
    console.log('[OWNER-BOOKINGS] Request from owner:');
    console.log('  • User _id:', ownerId.toString());
    console.log('  • Email:', req.user.email || 'missing');
    console.log('══════════════════════════════════════════════════════════════');

    // Find hostels owned by this user
    const myHostels = await Hostel.find({ owner: ownerId })
      .select('_id name')
      .lean();

    const hostelIds = myHostels.map(h => h._id);

    console.log('[OWNER-BOOKINGS] Owner controls:', myHostels.length, 'hostels');
    console.log('[OWNER-BOOKINGS] Hostel IDs:', hostelIds.map(id => id.toString()));

    if (hostelIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        bookings: [],
        message: 'No hostels found for this owner'
      });
    }

    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')
      .populate('hostel', 'name location type')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[OWNER-BOOKINGS] Found bookings:', bookings.length);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
      debug: {
        ownedHostelCount: myHostels.length,
        hostelIdsCount: hostelIds.length
      }
    });
  } catch (error) {
    console.error('[OWNER-BOOKINGS] ERROR:', error.message, error.stack?.substring(0, 500));
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

// Update booking status (accept/reject)
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

module.exports = router;