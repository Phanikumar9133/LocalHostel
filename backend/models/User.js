// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'owner'],
    default: 'user',
  },
  phone: {
    type: String,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  savedHostels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
  ],
});

// MODERN MONGOOSE WAY - NO 'next' PARAMETER NEEDED (Mongoose 6+)
userSchema.pre('save', async function () {
  // Password modify ayithe matrame hash chey
  if (!this.isModified('password')) {
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // No next() call - Mongoose automatically waits for async
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);