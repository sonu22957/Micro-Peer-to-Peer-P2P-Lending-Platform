// backend/routes/loanRoutes.js
const express = require('express');
const router = express.Router();

const {
  applyForLoan,
  getAllLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  approveLoan,
  rejectLoan,
  disburseLoan,
  closeLoan,
  getMyLoans,
  getLoanSummary,
  getLoanSchedule,
} = require('../controllers/loanController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ─────────────────────────────────────────────
// USER ROUTES (authenticated users)
// ─────────────────────────────────────────────

// @route   POST /api/loans/apply
// @desc    Submit a new loan application
// @access  Private
router.post('/apply', protect, applyForLoan);

// @route   GET /api/loans/my
// @desc    Get all loans belonging to the currently logged-in user
// @access  Private
router.get('/my', protect, getMyLoans);

// @route   GET /api/loans/:id
// @desc    Get a single loan by ID (user can only view their own; admin can view any)
// @access  Private
router.get('/:id', protect, getLoanById);

// @route   GET /api/loans/:id/schedule
// @desc    Get repayment schedule / EMI breakdown for a loan
// @access  Private
router.get('/:id/schedule', protect, getLoanSchedule);

// @route   PUT /api/loans/:id
// @desc    Update loan details (e.g. amount, purpose) before approval
// @access  Private
router.put('/:id', protect, updateLoan);

// ─────────────────────────────────────────────
// ADMIN ROUTES (admin / staff only)
// ─────────────────────────────────────────────

// @route   GET /api/loans
// @desc    Get all loan applications (with optional filters: status, userId, date range)
// @access  Private/Admin
router.get('/', protect, authorizeRoles('admin', 'staff'), getAllLoans);

// @route   GET /api/loans/summary
// @desc    Aggregate stats: total loans, total disbursed, pending count, NPA count, etc.
// @access  Private/Admin
router.get('/summary', protect, authorizeRoles('admin', 'staff'), getLoanSummary);

// @route   PATCH /api/loans/:id/approve
// @desc    Approve a pending loan application
// @access  Private/Admin
router.patch('/:id/approve', protect, authorizeRoles('admin', 'staff'), approveLoan);

// @route   PATCH /api/loans/:id/reject
// @desc    Reject a loan application with a reason
// @access  Private/Admin
router.patch('/:id/reject', protect, authorizeRoles('admin', 'staff'), rejectLoan);

// @route   PATCH /api/loans/:id/disburse
// @desc    Mark an approved loan as disbursed (funds released)
// @access  Private/Admin
router.patch('/:id/disburse', protect, authorizeRoles('admin'), disburseLoan);

// @route   PATCH /api/loans/:id/close
// @desc    Mark a fully repaid loan as closed
// @access  Private/Admin
router.patch('/:id/close', protect, authorizeRoles('admin'), closeLoan);

// @route   DELETE /api/loans/:id
// @desc    Delete a loan record (only allowed for draft / rejected loans)
// @access  Private/Admin
router.delete('/:id', protect, authorizeRoles('admin'), deleteLoan);

module.exports = router;
