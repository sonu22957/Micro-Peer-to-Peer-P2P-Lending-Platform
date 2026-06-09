// backend/middleware/errorMiddleware.js

/**
 * notFound
 * Catches requests to undefined routes and forwards a 404 error to the error handler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * errorHandler
 * Global error handling middleware. Must be registered last in Express.
 * Normalises all errors into a consistent JSON response shape.
 *
 * Handles:
 *  - Mongoose CastError         → 400 (invalid ObjectId)
 *  - Mongoose ValidationError   → 400 (schema validation failures)
 *  - Mongoose duplicate key      → 409 (unique field already exists)
 *  - JWT errors                 → 401
 *  - Stripe errors              → 402 / 502
 *  - Generic application errors → passed statusCode or 500
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // ── Mongoose: invalid ObjectId (e.g. malformed :id param) ──
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // ── Mongoose: schema validation errors ──
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose: duplicate key (unique index violation) ──
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `'${value}' is already registered for ${field}. Please use a different value.`;
  }

  // ── JWT: token errors ──
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Authentication failed.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ── Stripe errors ──
  if (err.type && err.type.startsWith('Stripe')) {
    statusCode = err.statusCode === 402 ? 402 : 502;
    message = `Payment error: ${err.message}`;
  }

  // ── Log the error in development ──
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${statusCode}`);
    console.error(err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Expose stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
