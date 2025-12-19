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

    // Handle uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    if (images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const hostel = await Hostel.create({
      name,
      location,
      type,
      price: Number(price),
      images,
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

    // Append new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      hostel.images = [...hostel.images, ...newImages];
    }

    hostel.availableSeats = hostel.rooms.reduce(
      (sum, room) => sum + (room.totalSeats - (room.occupied || 0)),
      0
    );

    await hostel.save();
    res.json(hostel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel || hostel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await hostel.remove();
    res.json({ message: 'Hostel deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};