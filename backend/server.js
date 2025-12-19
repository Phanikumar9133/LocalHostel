// server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // assuming you have db.js in config folder
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Allow frontend (React) to connect
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded images statically
app.use('/uploads', express.static('uploads')); // ← CRITICAL FOR IMAGES TO SHOW

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('HostelHub API is running successfully! 🚀');
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
  console.log(`Images accessible at: http://localhost:${PORT}/uploads/your-image.jpg`);
});