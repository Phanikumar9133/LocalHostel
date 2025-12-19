const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');

exports.createBooking = async (req, res) => {
  try {
    const { hostel, roomType, checkInDate } = req.body;

    // 1️⃣ Find hostel
    const hostelDoc = await Hostel.findById(hostel);
    if (!hostelDoc) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // 2️⃣ Find room
    const room = hostelDoc.rooms.find(r => r.type === roomType);
    if (!room) {
      return res.status(400).json({ message: 'Room type not found' });
    }

    // 3️⃣ Check seat availability
    if (room.totalSeats - room.occupied <= 0) {
      return res.status(400).json({ message: 'No seats available' });
    }

    // 4️⃣ Create booking
    const booking = await Booking.create({
      user: req.user.id,
      hostel: hostel,
      roomType,
      checkInDate,
      price: room.price,
    });

    // 5️⃣ Update seats
    room.occupied += 1;
    hostelDoc.availableSeats -= 1;
    await hostelDoc.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking
      .find({ user: req.user.id })
      .populate('hostel', 'name');
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
      .populate('user', 'name');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const hostel = await Hostel.findById(booking.hostel);
    if (hostel.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
