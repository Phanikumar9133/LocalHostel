const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {  // Ensure 'next' is the third param
  let token;
  console.log('protect middleware called');  // Debug log
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', token ? 'yes' : 'no');  // Debug
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();  // Call next() here
    } catch (error) {
      console.error('JWT Error:', error.message);  // Debug
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('No token provided');  // Debug
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Owners only' });
  }
};

module.exports = { protect, ownerOnly };