// controllers/bookingController.js
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const { sendBookingNotification } = require('../utils/sendEmail'); // Import email utility

// 1. Create a new booking (student)
exports.createBooking = async (req, res) => {
  try {
    const { hostel, roomType, checkInDate } = req.body;

    // Find hostel and populate owner email & name
    const hostelDoc = await Hostel.findById(hostel).populate('owner', 'email name');
    if (!hostelDoc) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Find the requested room type
    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) {
      return res.status(400).json({ success: false, message: 'Room type not found' });
    }

    // Check seat availability
    if (room.totalSeats - room.occupied <= 0) {
      return res.status(400).json({ success: false, message: 'No seats available for this room type' });
    }

    // Create the booking
    const booking = await Booking.create({
      user: req.user.id,
      hostel: hostel,
      roomType,
      checkInDate,
      price: room.price,
      status: 'Pending', // default status
    });

    // Update seat counts
    room.occupied += 1;
    hostelDoc.availableSeats -= 1;
    await hostelDoc.save();

    // Send email notification to hostel owner
    if (hostelDoc.owner?.email) {
      const emailSuccess = await sendBookingNotification(hostelDoc.owner.email, {
        _id: booking._id,
        studentName: req.user.name || 'A Student', // fallback if name not available
        hostelName: hostelDoc.name,
        roomType: booking.roomType,
        checkInDate: booking.checkInDate,
        price: booking.price,
      });

      if (!emailSuccess) {
        console.warn('Failed to send booking notification email to owner');
      }
    } else {
      console.warn('No owner email found for hostel:', hostelDoc._id);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully. Owner will review shortly.',
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

// 2. Get all bookings of the logged-in user (student)
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking
      .find({ user: req.user.id })
      .populate('hostel', 'name images location')
      .sort({ createdAt: -1 }); // newest first

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

// 3. Get all bookings for hostels owned by the logged-in owner
exports.getOwnerBookings = async (req, res) => {
  try {
    // Find all hostels owned by this user
    const hostels = await Hostel.find({ owner: req.user.id }).select('_id');
    const hostelIds = hostels.map(h => h._id);

    // Find bookings for these hostels
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

// 4. Update booking status (approve/reject) - Owner only
exports.updateBookingStatus = async (req, res) => {
  try {
    const status = req.body?.status;

    if (!status || !['Confirmed', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing status. Must be "Confirmed" or "Rejected"',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Find hostel and verify ownership
    const hostel = await Hostel.findById(booking.hostel);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    if (hostel.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied - You are not the owner' });
    }

    // If rejected → rollback seat count
    if (status === 'Rejected') {
      const room = hostel.rooms.find(r => r.type === booking.roomType);
      if (room) {
        room.occupied = Math.max(0, room.occupied - 1);
        hostel.availableSeats += 1;
        await hostel.save();
      }
    }

    // Update booking status
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
      message: 'Server error while updating booking status',
      error: error.message,
    });
  }
};