// backend/middleware/roleMiddleware.js

/**
 * authorizeRoles
 * Factory middleware that restricts access to the specified roles.
 * Must be used AFTER the `protect` middleware (req.user must be set).
 *
 * Usage:
 *   router.get('/admin-only', protect, authorizeRoles('admin'), handler);
 *   router.get('/staff-or-admin', protect, authorizeRoles('admin', 'staff'), handler);
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'staff', 'user')
 * @returns {Function} Express middleware
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): [${roles.join(', ')}]. Your role: '${req.user.role}'.`,
      });
    }

    next();
  };
};

/**
 * authorizeOwnerOrAdmin
 * Allows access if the requesting user is the resource owner OR has an elevated role.
 * Compares req.user.id against a field on req (params, body, or query).
 *
 * Usage:
 *   router.get('/loans/:userId', protect, authorizeOwnerOrAdmin('params', 'userId'), handler);
 *
 * @param {'params'|'body'|'query'} source - Where to find the owner ID on req
 * @param {string} field                   - The key name holding the owner's user ID
 * @param {string[]} [adminRoles]          - Roles that bypass ownership check (default: ['admin', 'staff'])
 * @returns {Function} Express middleware
 */
const authorizeOwnerOrAdmin = (source = 'params', field = 'userId', adminRoles = ['admin', 'staff']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Elevated roles bypass the ownership check
    if (adminRoles.includes(req.user.role)) {
      return next();
    }

    const resourceOwnerId = req[source]?.[field];

    if (!resourceOwnerId) {
      return res.status(400).json({
        success: false,
        message: `Owner ID not found in req.${source}.${field}.`,
      });
    }

    if (req.user.id !== resourceOwnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
      });
    }

    next();
  };
};

module.exports = { authorizeRoles, authorizeOwnerOrAdmin };
