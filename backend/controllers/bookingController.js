// controllers/bookingController.js
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');

exports.createBooking = async (req, res) => {
  try {
    const { hostel, roomType, checkInDate } = req.body;

    const hostelDoc = await Hostel.findById(hostel);
    if (!hostelDoc) return res.status(404).json({ message: 'Hostel not found' });

    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) return res.status(400).json({ message: 'Room type not found' });

    if (room.totalSeats - room.occupied <= 0) {
      return res.status(400).json({ message: 'No seats available' });
    }

    const booking = await Booking.create({
      user: req.user.id,
      hostel,
      roomType,
      checkInDate,
      price: room.price,
    });

    room.occupied += 1;
    hostelDoc.availableSeats -= 1;
    await hostelDoc.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking
      .find({ user: req.user.id })
      .populate('hostel', 'name images location');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOwnerBookings = async (req, res) => {
  try {
    const hostels = await Hostel.find({ owner: req.user.id });
    const hostelIds = hostels.map(h => h._id);

    const bookings = await Booking
      .find({ hostel: { $in: hostelIds } })
      .populate('user', 'name email phone')
      .populate('hostel', 'name location');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    // Safely get status (don't destructure if body is undefined)
    const status = req.body?.status;

    if (!status || !['Confirmed', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or missing status. Must be "Confirmed" or "Rejected"' 
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const hostel = await Hostel.findById(booking.hostel);
    if (!hostel || hostel.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied - You are not the owner' });
    }

    // Rollback seats if rejected
    if (status === 'Rejected') {
      const room = hostel.rooms.find(r => r.type === booking.roomType);
      if (room) {
        room.occupied = Math.max(0, room.occupied - 1);
        hostel.availableSeats += 1;
        await hostel.save();
      }
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking,
    });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};