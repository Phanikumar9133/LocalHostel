const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Boys Hostel', 'Girls Hostel'], required: true },
  price: { type: Number, required: true },
  images: [{ type: String }], // Array of image URLs
  facilities: [{ type: String }], // e.g., ['Free WiFi', 'Food']
  availableSeats: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rooms: [{
    type: { type: String, enum: ['Single', '2-Sharing', '3-Sharing', '5-Sharing'] },
    totalSeats: { type: Number },
    occupied: { type: Number, default: 0 },
    price: { type: Number },
  }],
});

module.exports = mongoose.model('Hostel', hostelSchema);