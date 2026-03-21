const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');

const router = express.Router();

// Create a new booking (student only)
router.post('/', protect, createBooking);

// Get my bookings (student)
router.get('/user', protect, getUserBookings);

// Get all bookings for my hostels (owner only)
router.get('/owner', protect, ownerOnly, async (req, res) => {
  try {
    console.log(`[BOOKING ROUTE] Fetching bookings for owner: ${req.user._id}`);

    const bookings = await Booking.find({ owner: req.user._id })
      .populate('user', 'name email')      // show student name/email
      .populate('hostel', 'name location') // show hostel name/location
      .sort({ createdAt: -1 });

    console.log(`[BOOKING ROUTE] Found ${bookings.length} bookings`);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('[BOOKING ROUTE] Error fetching owner bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

// Update booking status (accept/reject) - owner only
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

module.exports = router;