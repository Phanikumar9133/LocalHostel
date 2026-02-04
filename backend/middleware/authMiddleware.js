// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');  // ← ADD THIS if missing

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      console.log('Token found:', token.substring(0, 20) + '...');

      // Verify token with safety check
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured in .env');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded payload:', decoded);

      // Safety check for valid ID
      if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
        throw new Error('Invalid user ID in token');
      }

      const user = await User.findById(decoded.id).select('-password');
      console.log('Found user ID:', user?._id?.toString());
      console.log('Found user role:', user?.role);

      if (!user) {
        console.log('WARNING: User not found in database for ID:', decoded.id);
        return res.status(401).json({ message: 'Not authorized - user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT/Protect Error:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack ? error.stack.substring(0, 200) : 'No stack'
      });
      return res.status(401).json({ 
        message: 'Not authorized, token failed',
        error: error.message 
      });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'owner' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Owners or Admins only' });
  }
};

// middleware/authMiddleware.js

const adminOnly = (req, res, next) => {
  console.log('Admin middleware check → User:', req.user?.id);
  console.log('User role:', req.user?.role);
  console.log('Is admin?', req.user?.role === 'admin');

  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};


module.exports = { protect, ownerOnly, adminOnly };