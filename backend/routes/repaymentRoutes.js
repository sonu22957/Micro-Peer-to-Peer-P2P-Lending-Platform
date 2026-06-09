// backend/routes/repaymentRoutes.js
const express = require('express');
const router = express.Router();

const {
  createRepayment,
  getRepaymentById,
  getMyRepayments,
  getRepaymentsByLoan,
  getAllRepayments,
  markRepaymentPaid,
  markRepaymentOverdue,
  waiveRepayment,
  deleteRepayment,
  getRepaymentSummary,
  getUpcomingRepayments,
} = require('../controllers/repaymentController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ─────────────────────────────────────────────
// USER ROUTES (authenticated users)
// ─────────────────────────────────────────────

// @route   GET /api/repayments/my
// @desc    Get all repayment installments for the currently logged-in user
// @access  Private
router.get('/my', protect, getMyRepayments);

// @route   GET /api/repayments/my/upcoming
// @desc    Get upcoming (due soon) repayment installments for the current user
// @access  Private
router.get('/my/upcoming', protect, getUpcomingRepayments);

// @route   GET /api/repayments/loan/:loanId
// @desc    Get all repayment installments for a specific loan
// @access  Private
router.get('/loan/:loanId', protect, getRepaymentsByLoan);

// @route   GET /api/repayments/:id
// @desc    Get a single repayment installment by ID
// @access  Private
router.get('/:id', protect, getRepaymentById);

// ─────────────────────────────────────────────
// ADMIN ROUTES (admin / staff only)
// ─────────────────────────────────────────────

// @route   POST /api/repayments
// @desc    Manually create a repayment installment entry for a loan
// @access  Private/Admin
router.post('/', protect, authorizeRoles('admin', 'staff'), createRepayment);

// @route   GET /api/repayments
// @desc    Get all repayment records (filters: loanId, userId, status, dueDate range)
// @access  Private/Admin
router.get('/', protect, authorizeRoles('admin', 'staff'), getAllRepayments);

// @route   GET /api/repayments/summary
// @desc    Aggregate stats: total due, total collected, overdue count, waived amount
// @access  Private/Admin
router.get('/summary', protect, authorizeRoles('admin', 'staff'), getRepaymentSummary);

// @route   PATCH /api/repayments/:id/paid
// @desc    Mark a repayment installment as paid (after payment is received)
// @access  Private/Admin
router.patch('/:id/paid', protect, authorizeRoles('admin', 'staff'), markRepaymentPaid);

// @route   PATCH /api/repayments/:id/overdue
// @desc    Mark a repayment installment as overdue (missed due date)
// @access  Private/Admin
router.patch('/:id/overdue', protect, authorizeRoles('admin', 'staff'), markRepaymentOverdue);

// @route   PATCH /api/repayments/:id/waive
// @desc    Waive a repayment installment (e.g. for hardship cases)
// @access  Private/Admin
router.patch('/:id/waive', protect, authorizeRoles('admin'), waiveRepayment);

// @route   DELETE /api/repayments/:id
// @desc    Delete a repayment record (only for pending / draft entries)
// @access  Private/Admin
router.delete('/:id', protect, authorizeRoles('admin'), deleteRepayment);

module.exports = router;
