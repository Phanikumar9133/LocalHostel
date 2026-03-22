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

// ────────────────────────────────────────────────────────────────────────────────
// CORS – properly configured for Vercel + local development
// ────────────────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'https://local-hostel.vercel.app',      // your deployed frontend
    'http://localhost:5173',                // Vite dev
    'http://localhost:3000',                // Create React App / other local
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parse JSON & URL-encoded bodies (with reasonable size limit)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ────────────────────────────────────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hostels', require('./routes/hostelRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root route – simple health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HostelHub API is live 🚀',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Test email route (for debugging – can be removed later)
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
    res.status(500).json({
      success: false,
      message: "Test email failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ────────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:');
  console.error('URL:', req.method, req.originalUrl);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack?.substring(0, 500) || 'no stack');

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API base: ${process.env.NODE_ENV === 'production' ? 'https://localhostel.onrender.com' : 'http://localhost:' + PORT}`);
  console.log('CORS allowed: https://local-hostel.vercel.app + localhost:5173');
  console.log('══════════════════════════════════════════════════════════════');
});