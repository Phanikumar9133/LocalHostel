// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', token.substring(0, 20) + '...'); // partial for safety

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded payload:', decoded);                    // ← IMPORTANT

      const user = await User.findById(decoded.id).select('-password');
      console.log('Found user ID:', user?._id?.toString());       // ← IMPORTANT
      console.log('Found user role:', user?.role);

      if (!user) {
        console.log('WARNING: User not found in database for ID:', decoded.id);
        return res.status(401).json({ message: 'Not authorized - user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT/Protect Error:', error.name, error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
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