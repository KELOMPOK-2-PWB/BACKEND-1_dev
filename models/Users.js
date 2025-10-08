// File: models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Kita akan pakai bcryptjs untuk hash password

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama tidak boleh kosong'],
  },
  username: {
    type: String,
    required: [true, 'Username tidak boleh kosong'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email tidak boleh kosong'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password tidak boleh kosong'],
    select: false, 
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin', 'seller'], // role yang ada
    default: 'user',
  },
  avatar: {
    type: String,
    default: 'default-avatar.png',
  },
  phoneNumber: { 
    type: String,
  },
  isVerified: { 
    type: Boolean,
    default: false,
  },
  permissions: [String], 

  sellerInfo: {
    store: String,
    socialMedia: {
        instagram: String,
        facebook: String
    },
    rating: {
        type: Number,
        default: 0
    },
    followers: {
        type: Number,
        default: 0
    },
  }
}, {
  timestamps: true 
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);