// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { register, login, logout, getProfile } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get JWT
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Invalidate token (client‑side can just delete it)
router.post('/logout', logout);

// @route   GET /api/auth/me
// @desc    Get current user profile (protected)
router.get('/me', getProfile);

module.exports = router;
