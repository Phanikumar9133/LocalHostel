const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const mongoose = require('mongoose');
const { sendBookingNotification } = require('../utils/sendEmail');
// controllers/bookingController.js
exports.createBooking = async (req, res) => {
  try {
    console.log('[BOOKING] User:', req.user?._id, req.user?.name || '(no name)');
    console.log('[BOOKING] Payload:', req.body);

    const { hostel, roomType, checkInDate } = req.body;

    if (!hostel || !roomType || !checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Hostel ID, room type, and check-in date are required',
      });
    }

    // Validate ObjectId format early
    if (!mongoose.Types.ObjectId.isValid(hostel)) {
      return res.status(400).json({ success: false, message: 'Invalid hostel ID format' });
    }

    const checkIn = new Date(checkInDate);
    if (isNaN(checkIn.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid check-in date format (use YYYY-MM-DD)' });
    }
    if (checkIn < new Date()) {
      return res.status(400).json({ success: false, message: 'Check-in date cannot be in the past' });
    }

    // ← THIS IS THE CRITICAL LINE — declare hostelDoc here
    const hostelDoc = await Hostel.findById(hostel).populate('owner', 'email name');

    if (!hostelDoc) {
      console.log('[BOOKING] Hostel not found:', hostel);
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Now it's safe to use hostelDoc
    console.log('[BOOKING] Hostel found:', hostelDoc.name, 'Owner:', hostelDoc.owner?.name || '(no owner)');

    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) {
      console.log('[BOOKING] Room type not found. Sent:', roomType, 'Available:', hostelDoc.rooms.map(r => r.type));
      return res.status(400).json({
        success: false,
        message: `Room type "${roomType}" not available in this hostel`,
      });
    }

    const available = (room.totalSeats || 0) - (room.occupied || 0);
    console.log('[BOOKING] Room:', room.type, 'Available seats:', available);

    if (available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this room type right now',
      });
    }

    const booking = await Booking.create({
      user: req.user._id,
      hostel: hostel,
      roomType,
      checkInDate: checkIn,
      price: room.price,
      status: 'Pending',
    });

    console.log('[BOOKING] Created booking ID:', booking._id);

    // Send email (safe check)
    if (hostelDoc.owner?.email) {
      await sendBookingNotification(hostelDoc.owner.email, {
        bookingId: booking._id.toString(),
        studentName: req.user.name || 'A Student',
        hostelName: hostelDoc.name,
        roomType: booking.roomType,
        checkInDate: booking.checkInDate.toLocaleDateString(),
        price: booking.price,
        status: booking.status,
      }).catch(err => console.warn('[BOOKING] Email send failed:', err.message));
    } else {
      console.warn('[BOOKING] No owner email found for hostel:', hostelDoc._id);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Waiting for owner approval.',
      booking,
    });

  } catch (error) {
    console.error('[BOOKING] CRASH:', error.name, error.message, error.stack?.substring(0, 300));
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: error.message,
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking
      .find({ user: req.user._id })
      .populate('hostel', 'name location type images price')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Get User Bookings Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your bookings',
      error: error.message,
    });
  }
};

exports.getOwnerBookings = async (req, res) => {
  try {
    // Find all hostels owned by this user
    const hostels = await Hostel.find({ owner: req.user._id }).select('_id');

    const hostelIds = hostels.map(h => h._id);

    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')
      .populate('hostel', 'name location type')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Get Owner Bookings Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching owner bookings',
      error: error.message,
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Confirmed', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "Confirmed" or "Rejected"',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const hostel = await Hostel.findById(booking.hostel);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    if (hostel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the owner of this hostel' });
    }

    if (booking.status === 'Confirmed' || booking.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: `This booking is already ${booking.status.toLowerCase()}`,
      });
    }

    const room = hostel.rooms.find(r => r.type === booking.roomType);
    if (!room) {
      return res.status(400).json({ success: false, message: 'Room type not found' });
    }

    if (status === 'Confirmed') {
      room.occupied = Number(room.occupied || 0) + 1;
      hostel.availableSeats = Math.max(0, Number(hostel.availableSeats || 0) - 1);
      await hostel.save();
    }

    booking.status = status;
    await booking.save();

    return res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking,
    });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating booking',
      error: error.message,
    });
  }
};