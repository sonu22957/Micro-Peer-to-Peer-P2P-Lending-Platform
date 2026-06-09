// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * protect
 * Verifies the JWT token sent in the Authorization header (Bearer <token>).
 * On success, attaches the decoded user payload to req.user and calls next().
 * On failure, responds with 401 Unauthorized.
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload (id, role, email, etc.) to request
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Authentication failed.',
    });
  }
};

module.exports = { protect };
