// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();

const {
  getDashboardSummary,
  getUserLoans,
  getUserPayments,
} = require('../controllers/dashboardController');

// @route   GET /api/dashboard/summary
// @desc    Return aggregated data for the user's dashboard (total loans, amount repaid, pending repayments, etc.)
router.get('/summary', getDashboardSummary);

// @route   GET /api/dashboard/loans
// @desc    List all loans belonging to the authenticated user
router.get('/loans', getUserLoans);

// @route   GET /api/dashboard/payments
// @desc    List recent payment/repayment activity for the user
router.get('/payments', getUserPayments);

module.exports = router;
