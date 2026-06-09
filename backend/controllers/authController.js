// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// ─── Inline User Schema ───────────────────────────────────────────────────────
// If you have a dedicated models/ folder, replace this with:
//   const User = require('../models/User');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sendTokenResponse = (res, user, statusCode = 200) => {
  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Only allow admin-level role assignment if the requester is an admin
    const assignedRole = req.user?.role === 'admin' && role ? role : 'user';

    const user = await User.create({ name, email, password, role: assignedRole });

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: 'Welcome to Loan Management',
      text: `Hi ${user.name}, your account has been created successfully.`,
      html: `<p>Hi <strong>${user.name}</strong>,</p><p>Your account has been created successfully. You can now log in and apply for loans.</p>`,
    }).catch((err) => console.error('Welcome email failed:', err));

    sendTokenResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    sendTokenResponse(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Logout user (client should discard token; server-side is stateless)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update current user's profile (name, email)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change current user's password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};
