// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

/**
 * generateToken
 * Signs and returns a JWT for the given user payload.
 * @param {object} payload - Data to encode (e.g. { id, role, email })
 * @param {string} [expiresIn] - Token TTL, defaults to JWT_EXPIRES_IN env var or '7d'
 * @returns {string} Signed JWT string
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = generateToken;
