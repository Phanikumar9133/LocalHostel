// controllers/bookingController.js
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const { sendBookingNotification } = require('../utils/sendEmail');

// 1. Student creates booking request (Pending) → DO NOT occupy seat yet
exports.createBooking = async (req, res) => {
  try {
    const { hostel, roomType, checkInDate } = req.body;

    if (!hostel || !roomType || !checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Hostel ID, room type, and check-in date are required',
      });
    }

    // Find hostel + owner info
    const hostelDoc = await Hostel.findById(hostel).populate('owner', 'email name');
    if (!hostelDoc) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Find requested room type
    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) {
      return res.status(400).json({ success: false, message: 'Room type not found in this hostel' });
    }

    // Check CURRENT real availability (only confirmed seats are occupied)
    const available = (room.totalSeats || 0) - (room.occupied || 0);
    if (available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this room type right now',
      });
    }

    // Create pending booking → seat is NOT occupied yet
    const booking = await Booking.create({
      user: req.user.id,
      hostel: hostel,
      roomType,
      checkInDate: new Date(checkInDate),
      price: room.price,
      status: 'Pending',
    });

    // Notify owner
    if (hostelDoc.owner?.email) {
      await sendBookingNotification(hostelDoc.owner.email, {
        bookingId: booking._id,
        studentName: req.user.name || 'A Student',
        hostelName: hostelDoc.name,
        roomType: booking.roomType,
        checkInDate: booking.checkInDate.toLocaleDateString(),
        price: booking.price,
        status: booking.status,
      }).catch(err => console.warn('Email send failed:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Waiting for owner approval.',
      booking,
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: error.message,
    });
  }
};

// 2. Get my bookings (student)
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking
      .find({ user: req.user.id })
      .populate('hostel', 'name images location price')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Get User Bookings Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: error.message,
    });
  }
};

// 3. Get bookings for my hostels (owner)
exports.getOwnerBookings = async (req, res) => {
  try {
    const hostels = await Hostel.find({ owner: req.user.id }).select('_id');
    const hostelIds = hostels.map(h => h._id);

    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')
      .populate('hostel', 'name location')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
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

// 4. Owner approves or rejects booking → update occupied ONLY on confirm
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

    if (hostel.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not the owner' });
    }

    // Prevent changing already final status
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

    // ────────────────────────────────────────────────
    // Only change occupied count when confirming
    // ────────────────────────────────────────────────
    if (status === 'Confirmed') {
      room.occupied = Number(room.occupied || 0) + 1;
      hostel.availableSeats = Math.max(0, Number(hostel.availableSeats || 0) - 1);
      await hostel.save();
    }

    // If rejecting a previously confirmed booking (rare case) → rollback
    if (status === 'Rejected' && booking.status === 'Confirmed') {
      room.occupied = Math.max(0, Number(room.occupied || 0) - 1);
      hostel.availableSeats = Number(hostel.availableSeats || 0) + 1;
      await hostel.save();
    }

    // Update booking
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