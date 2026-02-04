const Hostel = require('../models/Hostel');

exports.getAllHostels = async (req, res) => {
  try {
    const { location, type, maxPrice, minPrice } = req.query;
    const filter = {};

    if (location) {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }
    if (type) {
      filter.type = type;
    }
    if (maxPrice || minPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const hostels = await Hostel.find(filter)
      .populate('owner', 'name email phone role')
      .lean(); // faster, removes mongoose methods

    res.json({
      success: true,
      count: hostels.length,
      hostels,
    });
  } catch (error) {
    console.error('Get All Hostels Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hostels',
      error: error.message,
    });
  }
};

exports.getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id)
      .populate('owner', 'name email phone role')
      .lean();

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    res.json({
      success: true,
      hostel,
    });
  } catch (error) {
    console.error('Get Hostel By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.createHostel = async (req, res) => {
  try {
    const { name, location, type, price, facilities, rooms } = req.body;

    // Basic required field validation
    if (!name || !location || !type || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, type and price are required',
      });
    }

    if (!req.files?.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    const images = req.files.map(file => file.path);

    let parsedFacilities = [];
    let parsedRooms = [];

    try {
      parsedFacilities = facilities ? JSON.parse(facilities) : [];
      parsedRooms = rooms ? JSON.parse(rooms) : [];
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in facilities or rooms field',
      });
    }

    if (!Array.isArray(parsedFacilities) || !Array.isArray(parsedRooms)) {
      return res.status(400).json({
        success: false,
        message: 'Facilities and rooms must be arrays',
      });
    }

    const availableSeats = parsedRooms.reduce((sum, room) => {
      const total = Number(room.totalSeats) || 0;
      const occupied = Number(room.occupied) || 0;
      return sum + Math.max(0, total - occupied);
    }, 0);

    const hostel = await Hostel.create({
      name: name.trim(),
      location: location.trim(),
      type,
      price: Number(price),
      images,
      facilities: parsedFacilities,
      rooms: parsedRooms,
      owner: req.user._id,
      availableSeats,
    });

    res.status(201).json({
      success: true,
      message: 'Hostel created successfully',
      hostel,
    });
  } catch (error) {
    console.error('Create Hostel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hostel',
      error: error.message,
    });
  }
};

exports.updateHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    // Authorization
    const isOwner = hostel.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this hostel',
      });
    }

    const { name, location, type, price, facilities, rooms } = req.body;

    if (name) hostel.name = name.trim();
    if (location) hostel.location = location.trim();
    if (type) hostel.type = type;
    if (price) hostel.price = Number(price);

    if (facilities !== undefined) {
      try {
        hostel.facilities = JSON.parse(facilities);
        if (!Array.isArray(hostel.facilities)) throw new Error();
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for facilities',
        });
      }
    }

    if (rooms !== undefined) {
      try {
        hostel.rooms = JSON.parse(rooms);
        if (!Array.isArray(hostel.rooms)) throw new Error();
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for rooms',
        });
      }

      // Recalculate available seats when rooms are updated
      hostel.availableSeats = hostel.rooms.reduce((sum, room) => {
        const total = Number(room.totalSeats) || 0;
        const occupied = Number(room.occupied) || 0;
        return sum + Math.max(0, total - occupied);
      }, 0);
    }

    // Add new images if uploaded
    if (req.files?.length) {
      const newImages = req.files.map(file => file.path);
      hostel.images = [...(hostel.images || []), ...newImages];
    }

    await hostel.save();

    res.json({
      success: true,
      message: 'Hostel updated successfully',
      hostel,
    });
  } catch (error) {
    console.error('Update Hostel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hostel',
      error: error.message,
    });
  }
};

exports.deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    const isOwner = hostel.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this hostel',
      });
    }

    await Hostel.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Hostel deleted successfully',
    });
  } catch (error) {
    console.error('Delete Hostel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hostel',
      error: error.message,
    });
  }
};