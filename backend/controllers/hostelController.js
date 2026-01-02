// controllers/hostelController.js
const Hostel = require('../models/Hostel');

exports.getAllHostels = async (req, res) => {
  try {
    const { location, type, maxPrice } = req.query;
    const filter = {};
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (type) filter.type = type;
    if (maxPrice) filter.price = { $lte: maxPrice };

    const hostels = await Hostel.find(filter).populate('owner', 'name');
    res.json(hostels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('owner', 'name');
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    res.json(hostel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createHostel = async (req, res) => {
  try {
    const { name, location, type, price, facilities, rooms } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // FIXED: Use file.path from Cloudinary (full URL)
    const images = req.files.map(file => file.path);

    const hostel = await Hostel.create({
      name,
      location,
      type,
      price: Number(price),
      images,  // Now full Cloudinary URLs
      facilities: facilities ? JSON.parse(facilities) : [],
      rooms: rooms ? JSON.parse(rooms) : [],
      owner: req.user._id,
      availableSeats: (rooms ? JSON.parse(rooms) : []).reduce(
        (sum, room) => sum + (room.totalSeats - (room.occupied || 0)),
        0
      ),
    });

    res.status(201).json(hostel);
  } catch (error) {
    console.error('Create Hostel Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel || hostel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, location, type, price, facilities, rooms } = req.body;

    if (name) hostel.name = name;
    if (location) hostel.location = location;
    if (type) hostel.type = type;
    if (price) hostel.price = Number(price);
    if (facilities) hostel.facilities = JSON.parse(facilities);
    if (rooms) hostel.rooms = JSON.parse(rooms);

    // FIXED: Add new images with full Cloudinary URLs
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      hostel.images = [...hostel.images, ...newImages];
    }

    // Recalculate available seats
    hostel.availableSeats = hostel.rooms.reduce(
      (sum, room) => sum + (room.totalSeats - (room.occupied || 0)),
      0
    );

    await hostel.save();
    res.json(hostel);
  } catch (error) {
    console.error('Update Hostel Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel || hostel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await Hostel.deleteOne({ _id: req.params.id });
    res.json({ message: 'Hostel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};