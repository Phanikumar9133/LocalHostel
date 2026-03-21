const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const mongoose = require('mongoose');
const { sendBookingNotification } = require('../utils/sendEmail');

exports.createBooking = async (req, res) => {
  try {
    console.log('[BOOKING CREATE] User:', req.user?._id, req.user?.name || '(no name)');
    console.log('[BOOKING CREATE] Payload:', req.body);

    const { hostel, roomType, checkInDate } = req.body;

    if (!hostel || !roomType || !checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Hostel ID, room type, and check-in date are required',
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

    // Fetch hostel with owner populated
    const hostelDoc = await Hostel.findById(hostel).populate('owner', 'email name');

    if (!hostelDoc) {
      console.log('[BOOKING CREATE] Hostel not found:', hostel);
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    console.log('[BOOKING CREATE] Hostel found:', hostelDoc.name, 'Owner:', hostelDoc.owner?.name || '(no owner)');

    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) {
      console.log('[BOOKING CREATE] Room type not found. Requested:', roomType, 'Available types:', hostelDoc.rooms.map(r => r.type));
      return res.status(400).json({
        success: false,
        message: `Room type "${roomType}" not available in this hostel`,
      });
    }

    const available = (room.totalSeats || 0) - (room.occupied || 0);
    console.log('[BOOKING CREATE] Room:', room.type, 'Available seats:', available);

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

    console.log('[BOOKING CREATE] Created booking ID:', booking._id);

    // Send notification email (safe check)
    if (hostelDoc.owner?.email) {
      try {
        await sendBookingNotification(hostelDoc.owner.email, {
          bookingId: booking._id.toString(),
          studentName: req.user.name || 'A Student',
          hostelName: hostelDoc.name,
          roomType: booking.roomType,
          checkInDate: booking.checkInDate.toLocaleDateString(),
          price: booking.price,
          status: booking.status,
        });
        console.log('[BOOKING CREATE] Notification email queued');
      } catch (emailErr) {
        console.warn('[BOOKING CREATE] Email send failed:', emailErr.message);
      }
    } else {
      console.warn('[BOOKING CREATE] No owner email found for hostel:', hostelDoc._id);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request sent successfully. Waiting for owner approval.',
      booking,
    });
  } catch (error) {
    console.error('[BOOKING CREATE] CRASH:', error.name, error.message, error.stack?.substring(0, 500));
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    console.log('[BOOKING USER] Fetching bookings for user:', req.user?._id);

    const bookings = await Booking
      .find({ user: req.user._id })
      .populate('hostel', 'name location type images price')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[BOOKING USER] Found:', bookings.length);

    return res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('[BOOKING USER] ERROR:', error.message, error.stack?.substring(0, 300));
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getOwnerBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.log('[BOOKING OWNER] No authenticated user in request');
      return res.status(401).json({ success: false, message: 'Unauthorized - please login' });
    }

    console.log('[BOOKING OWNER] Fetching bookings for owner:', req.user._id);

    // Find all hostels owned by this user
    const ownedHostels = await Hostel.find({ owner: req.user._id }).select('_id').lean();
    const hostelIds = ownedHostels.map(h => h._id);

    console.log('[BOOKING OWNER] Owner controls', hostelIds.length, 'hostels');

    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')     // safe fields
      .populate('hostel', 'name location type') // safe fields
      .sort({ createdAt: -1 })
      .lean(); // faster, avoids mongoose document overhead

    console.log('[BOOKING OWNER] Found bookings:', bookings.length);

    return res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('[BOOKING OWNER] CRASH:', error.name, error.message, error.stack?.substring(0, 500));
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching owner bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    // Security check
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
      return res.status(400).json({ success: false, message: 'Room type not found in hostel' });
    }

    // Update occupancy only if confirming
    if (status === 'Confirmed') {
      room.occupied = Number(room.occupied || 0) + 1;
      hostel.availableSeats = Math.max(0, Number(hostel.availableSeats || 0) - 1);
      await hostel.save({ validateBeforeSave: false }); // skip some validations for speed
    }

    booking.status = status;
    await booking.save();

    console.log('[BOOKING UPDATE] Status changed to', status, 'for booking:', booking._id);

    return res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking,
    });
  } catch (error) {
    console.error('[BOOKING UPDATE] CRASH:', error.name, error.message, error.stack?.substring(0, 500));
    return res.status(500).json({
      success: false,
      message: 'Server error while updating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};