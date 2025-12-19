const express = require('express');
const { protect, ownerOnly } = require('../middleware/authMiddleware');
const { createBooking, getUserBookings, getOwnerBookings, updateBookingStatus } = require('../controllers/bookingController');

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/owner', protect, ownerOnly, getOwnerBookings);
router.put('/:id', protect, ownerOnly, updateBookingStatus);

module.exports = router;