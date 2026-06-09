// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

const {
  makePayment,
  getPaymentById,
  getMyPayments,
  getPaymentsByLoan,
  getAllPayments,
  verifyPayment,
  refundPayment,
  deletePayment,
  getPaymentSummary,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ─────────────────────────────────────────────
// USER ROUTES (authenticated users)
// ─────────────────────────────────────────────

// @route   POST /api/payments
// @desc    Record / initiate a payment against an active loan
// @access  Private
router.post('/', protect, makePayment);

// @route   GET /api/payments/my
// @desc    Get all payments made by the currently logged-in user
// @access  Private
router.get('/my', protect, getMyPayments);

// @route   GET /api/payments/loan/:loanId
// @desc    Get all payments associated with a specific loan
// @access  Private
router.get('/loan/:loanId', protect, getPaymentsByLoan);

// @route   GET /api/payments/:id
// @desc    Get a single payment record by its ID
// @access  Private
router.get('/:id', protect, getPaymentById);

// ─────────────────────────────────────────────
// ADMIN ROUTES (admin / staff only)
// ─────────────────────────────────────────────

// @route   GET /api/payments
// @desc    Get all payment records (with optional filters: loanId, userId, status, date range)
// @access  Private/Admin
router.get('/', protect, authorizeRoles('admin', 'staff'), getAllPayments);

// @route   GET /api/payments/summary
// @desc    Aggregate stats: total collected, pending, overdue, refunded amounts
// @access  Private/Admin
router.get('/summary', protect, authorizeRoles('admin', 'staff'), getPaymentSummary);

// @route   PATCH /api/payments/:id/verify
// @desc    Verify / confirm a payment (e.g. after bank reconciliation)
// @access  Private/Admin
router.patch('/:id/verify', protect, authorizeRoles('admin', 'staff'), verifyPayment);

// @route   PATCH /api/payments/:id/refund
// @desc    Initiate a refund for an erroneous or duplicate payment
// @access  Private/Admin
router.patch('/:id/refund', protect, authorizeRoles('admin'), refundPayment);

// @route   DELETE /api/payments/:id
// @desc    Delete a payment record (only for unverified / draft entries)
// @access  Private/Admin
router.delete('/:id', protect, authorizeRoles('admin'), deletePayment);

module.exports = router;
