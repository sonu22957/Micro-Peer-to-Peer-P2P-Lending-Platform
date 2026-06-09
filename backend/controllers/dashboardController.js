// backend/controllers/dashboardController.js
const mongoose = require('mongoose');

// ─── Inline Schemas ───────────────────────────────────────────────────────────
// Replace these with your dedicated model imports once models/ folder is set up:
//   const Loan       = require('../models/Loan');
//   const Payment    = require('../models/Payment');
//   const Repayment  = require('../models/Repayment');

// Loan Model
const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    termMonths: { type: Number, required: true },
    purpose: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disbursed', 'closed'],
      default: 'pending',
    },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);
const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);

// Payment Model
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['stripe', 'bank_transfer', 'cash', 'other'], default: 'stripe' },
    status: { type: String, enum: ['pending', 'verified', 'refunded'], default: 'pending' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

// Repayment Model
const repaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    installmentNumber: { type: Number, required: true },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived'],
      default: 'pending',
    },
  },
  { timestamps: true }
);
const Repayment = mongoose.models.Repayment || mongoose.model('Repayment', repaymentSchema);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get aggregated dashboard summary for the current user
 * @route   GET /api/dashboard/summary
 * @access  Private
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Run all aggregate queries in parallel for performance
    const [loanStats, repaymentStats, recentLoans] = await Promise.all([
      // Loan breakdown by status
      Loan.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // Repayment breakdown by status
      Repayment.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDue: { $sum: '$amountDue' },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
      ]),

      // 3 most recent loans
      Loan.find({ user: userId }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    // Reshape loan stats into a friendly map
    const loans = {
      total: 0,
      totalAmount: 0,
      byStatus: {},
    };
    loanStats.forEach(({ _id, count, totalAmount }) => {
      loans.byStatus[_id] = { count, totalAmount };
      loans.total += count;
      loans.totalAmount += totalAmount;
    });

    // Reshape repayment stats
    const repayments = {
      totalDue: 0,
      totalPaid: 0,
      totalOverdue: 0,
      byStatus: {},
    };
    repaymentStats.forEach(({ _id, count, totalDue, totalPaid }) => {
      repayments.byStatus[_id] = { count, totalDue, totalPaid };
      repayments.totalDue += totalDue;
      repayments.totalPaid += totalPaid;
      if (_id === 'overdue') repayments.totalOverdue += totalDue;
    });

    res.status(200).json({
      success: true,
      summary: {
        loans,
        repayments,
        recentLoans,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all loans for the current user (with pagination)
 * @route   GET /api/dashboard/loans
 * @access  Private
 */
const getUserLoans = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [loans, total] = await Promise.all([
      Loan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Loan.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      loans,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get recent payment & repayment activity for the current user
 * @route   GET /api/dashboard/payments
 * @access  Private
 */
const getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, repayments, totalPayments, totalRepayments] = await Promise.all([
      Payment.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('loan', 'amount status')
        .lean(),

      Repayment.find({ user: userId })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('loan', 'amount status')
        .lean(),

      Payment.countDocuments({ user: userId }),
      Repayment.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      success: true,
      payments: {
        total: totalPayments,
        page: Number(page),
        pages: Math.ceil(totalPayments / Number(limit)),
        data: payments,
      },
      upcomingRepayments: {
        total: totalRepayments,
        data: repayments,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary,
  getUserLoans,
  getUserPayments,
};
