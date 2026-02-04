// server.js
// server.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const { sendBookingNotification } = require('./utils/sendEmail');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // NEW: Admin routes

// Basic route for testing
app.get('/', (req, res) => {
  res.send('HostelHub API with Cloudinary is running successfully! 🚀');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
// Temporary test route - DELETE LATER
app.get('/api/test-email', async (req, res) => {
  try {
    const testOwnerEmail = "phanikumarpotharlanka1432@gmail.com"; // your real owner email from DB
    const testData = {
      studentName: "Phani Kumar (Test Student)",
      hostelName: "Test Hostel XYZ",
      roomType: "2-Sharing",
      checkInDate: new Date().toISOString(),
      price: 6500,
      bookingId: "TEST-BOOKING-999",           // fake but format like real
      _id: "TEST-BOOKING-999"                  // some functions use _id
    };

    const result = await sendBookingNotification(testOwnerEmail, testData);

    if (result) {
      return res.json({
        success: true,
        message: "Test email sent successfully! Check inbox/spam of owner123@gmail.com"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Email function returned false - check console logs"
      });
    }
  } catch (err) {
    console.error("Test email route error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while sending test email",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: https://your-render-app.onrender.com`);
});