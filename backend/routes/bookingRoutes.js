// routes/bookingRoutes.js
const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  updateBookingStatus,
  // cancelBooking, // if you add later
} = require('../controllers/bookingController');

const router = express.Router();

// Create a new booking (student)
router.post('/', protect, createBooking);

// Get my bookings (student)
router.get('/user', protect, getUserBookings);

// Get all bookings for my hostels (owner only)
router.get('/owner', protect, ownerOnly, getOwnerBookings);

// IMPORTANT: Update booking status (accept/reject) - this is the route you need!
router.put('/:id/status', protect, ownerOnly, updateBookingStatus);

// Optional: If you want to add cancel later
// router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;