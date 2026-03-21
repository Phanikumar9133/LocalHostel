const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const { sendBookingNotification } = require('./utils/sendEmail');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// ────────────────────────────────────────────────────────────────────────────────
// CORS - FIXED & EXPLICIT (no app.options('*') needed)
// ────────────────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',              // Vite dev
  'http://localhost:3000',              // fallback
  // Add your deployed frontend later, e.g.:
  // 'https://your-hostelhub-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow no-origin requests (Postman, curl, mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic test route
app.get('/', (req, res) => {
  res.send('HostelHub API is running successfully! 🚀');
});

// Test email route
app.get('/api/test-email', async (req, res) => {
  try {
    const testOwnerEmail = "phanikumarpotharlanka1432@gmail.com";
    const testData = {
      studentName: "Phani Kumar (Test Student)",
      hostelName: "Test Hostel XYZ",
      roomType: "2-Sharing",
      checkInDate: new Date().toISOString(),
      price: 6500,
      bookingId: "TEST-BOOKING-999",
      _id: "TEST-BOOKING-999"
    };

    const result = await sendBookingNotification(testOwnerEmail, testData);

    if (result) {
      res.json({ success: true, message: "Test email sent! Check inbox/spam" });
    } else {
      res.status(500).json({ success: false, message: "Email function failed" });
    }
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: ${process.env.NODE_ENV === 'production' ? 'https://localhostel.onrender.com' : 'http://localhost:5000'}`);
});