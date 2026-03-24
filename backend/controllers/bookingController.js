// controllers/bookingController.js
// FULL READY-TO-USE VERSION WITH RESEND EMAIL NOTIFICATION

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const { sendBookingNotification } = require('../utils/sendEmail');

exports.createBooking = async (req, res) => {
  try {
    console.log('[BOOKING CREATE] User ID:', req.user?._id?.toString());
    console.log('[BOOKING CREATE] User Name:', req.user?.name || '(no name)');
    console.log('[BOOKING CREATE] Payload:', req.body);

    const { hostel, roomType, checkInDate } = req.body;

    // Validation
    if (!hostel || !roomType || !checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Hostel ID, room type, and check-in date are required'
      });
    }

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

    // Fetch hostel with owner details
    const hostelDoc = await Hostel.findById(hostel)
      .populate('owner', 'email name')
      .lean();

    if (!hostelDoc) {
      console.log('[BOOKING CREATE] Hostel not found ID:', hostel);
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    console.log('[BOOKING CREATE] Hostel found:', hostelDoc.name, 'Owner:', hostelDoc.owner?.name || '(no owner)');

    // Check room availability
    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) {
      console.log('[BOOKING CREATE] Room type not found. Requested:', roomType);
      return res.status(400).json({
        success: false,
        message: `Room type "${roomType}" not available`
      });
    }

    const available = (room.totalSeats || 0) - (room.occupied || 0);
    console.log('[BOOKING CREATE] Room:', room.type, 'Available seats:', available);

    if (available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this room type'
      });
    }

    // Create the booking
    const booking = await Booking.create({
      user: req.user._id,
      hostel,
      roomType,
      checkInDate: checkIn,
      price: room.price,
      status: 'Pending'
    });

    console.log('[BOOKING CREATE] Booking created successfully. ID:', booking._id.toString());

    // Send email notification using Resend
    if (hostelDoc.owner?.email) {
      console.log(`[RESEND] Queuing notification to owner: ${hostelDoc.owner.email}`);

      const emailSent = await sendBookingNotification(hostelDoc.owner.email, {
        bookingId: booking._id.toString(),
        studentName: req.user.name || 'A Student',
        hostelName: hostelDoc.name,
        roomType,
        checkInDate: checkIn.toLocaleDateString('en-IN'),
        price: booking.price,
      });

      if (emailSent) {
        console.log(`[RESEND] Successfully sent to ${hostelDoc.owner.email}`);
      } else {
        console.warn(`[RESEND] Failed to send to ${hostelDoc.owner.email}`);
      }
    } else {
      console.warn('[BOOKING CREATE] No owner email found for hostel:', hostelDoc._id);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Waiting for owner approval.',
      booking: {
        _id: booking._id,
        hostel: booking.hostel,
        roomType: booking.roomType,
        checkInDate: booking.checkInDate,
        price: booking.price,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('[BOOKING CREATE] CRASH:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 600)
    });

    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const bookings = await Booking
      .find({ user: req.user._id })
      .populate('hostel', 'name location type images price')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('[BOOKING USER] ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getOwnerBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const ownerIdStr = req.user._id.toString();

    let ownerObjectId;
    try {
      ownerObjectId = new mongoose.Types.ObjectId(ownerIdStr);
    } catch (convErr) {
      return res.status(400).json({ success: false, message: 'Invalid owner ID' });
    }

    const ownedHostels = await Hostel.find({ owner: ownerObjectId })
      .select('_id')
      .lean();

    const hostelIds = ownedHostels.map(h => h._id);

    if (hostelIds.length === 0) {
      return res.json({ success: true, count: 0, bookings: [] });
    }

    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')
      .populate('hostel', 'name location type')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('[BOOKING OWNER] CRASH:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching owner bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Confirmed', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Confirmed" or "Rejected"'
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
      return res.status(403).json({ success: false, message: 'Not authorized - not hostel owner' });
    }

    if (booking.status === 'Confirmed' || booking.status === 'Rejected') {
      return res.status(400).json({
        success: false,
        message: `Booking already ${booking.status.toLowerCase()}`
      });
    }

    const room = hostel.rooms.find(r => r.type === booking.roomType);
    if (!room) {
      return res.status(400).json({ success: false, message: 'Room type not found in hostel' });
    }

    if (status === 'Confirmed') {
      room.occupied = Number(room.occupied || 0) + 1;
      hostel.availableSeats = Math.max(0, Number(hostel.availableSeats || 0) - 1);
      await hostel.save({ validateBeforeSave: false });
    }

    booking.status = status;
    await booking.save();

    console.log('[BOOKING UPDATE] Status updated to', status, 'for booking ID:', booking._id.toString());

    return res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking
    });
  } catch (error) {
    console.error('[BOOKING UPDATE] CRASH:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};