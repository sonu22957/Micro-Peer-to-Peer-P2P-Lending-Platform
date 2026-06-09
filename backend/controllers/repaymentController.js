// backend/controllers/repaymentController.js
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');

// ─── Inline Schemas ───────────────────────────────────────────────────────────
// Replace with:
//   const Repayment = require('../models/Repayment');
//   const Loan      = require('../models/Loan');

const repaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    installmentNumber: { type: Number, required: true, min: 1 },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    waivedAt: { type: Date },
    waiverReason: { type: String },
    lateFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived'],
      default: 'pending',
    },
  },
  { timestamps: true }
);
const Repayment = mongoose.models.Repayment || mongoose.model('Repayment', repaymentSchema);

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    termMonths: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disbursed', 'closed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);
const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Manually create a repayment installment (Admin use)
 * @route   POST /api/repayments
 * @access  Private/Admin
 */
const createRepayment = async (req, res, next) => {
  try {
    const { loanId, userId, installmentNumber, amountDue, dueDate } = req.body;

    if (!loanId || !userId || !installmentNumber || !amountDue || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'loanId, userId, installmentNumber, amountDue, and dueDate are all required.',
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Prevent duplicate installment numbers for the same loan
    const exists = await Repayment.findOne({ loan: loanId, installmentNumber });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Installment #${installmentNumber} already exists for this loan.`,
      });
    }

    const repayment = await Repayment.create({
      user: userId,
      loan: loanId,
      installmentNumber,
      amountDue,
      dueDate,
    });

    res.status(201).json({ success: true, repayment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all repayment installments for the current user (paginated)
 * @route   GET /api/repayments/my
 * @access  Private
 */
const getMyRepayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [repayments, total] = await Promise.all([
      Repayment.find(filter)
        .populate('loan', 'amount purpose status')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Repayment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      repayments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get upcoming (due within 30 days) repayment installments for the current user
 * @route   GET /api/repayments/my/upcoming
 * @access  Private
 */
const getUpcomingRepayments = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + Number(days));

    const repayments = await Repayment.find({
      user: req.user.id,
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $gte: now, $lte: future },
    })
      .populate('loan', 'amount purpose status')
      .sort({ dueDate: 1 })
      .lean();

    const overdueCount = repayments.filter((r) => r.status === 'overdue').length;
    const totalDue = repayments.reduce((sum, r) => sum + r.amountDue, 0);

    res.status(200).json({
      success: true,
      count: repayments.length,
      overdueCount,
      totalDue,
      repayments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all repayment installments for a specific loan
 * @route   GET /api/repayments/loan/:loanId
 * @access  Private
 */
const getRepaymentsByLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.loanId).lean();
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    if (req.user.role === 'user' && loan.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const repayments = await Repayment.find({ loan: req.params.loanId })
      .sort({ installmentNumber: 1 })
      .lean();

    const totalDue = repayments.reduce((sum, r) => sum + r.amountDue, 0);
    const totalPaid = repayments.reduce((sum, r) => sum + r.amountPaid, 0);
    const totalOutstanding = +(totalDue - totalPaid).toFixed(2);

    res.status(200).json({
      success: true,
      loanId: req.params.loanId,
      totalDue,
      totalPaid,
      totalOutstanding,
      count: repayments.length,
      repayments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single repayment installment by ID
 * @route   GET /api/repayments/:id
 * @access  Private
 */
const getRepaymentById = async (req, res, next) => {
  try {
    const repayment = await Repayment.findById(req.params.id)
      .populate('loan', 'amount purpose status')
      .lean();

    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found.' });
    }

    if (req.user.role === 'user' && repayment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, repayment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all repayment records — Admin/Staff (paginated + filterable)
 * @route   GET /api/repayments
 * @access  Private/Admin
 */
const getAllRepayments = async (req, res, next) => {
  try {
    const { status, loanId, userId, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (loanId) filter.loan = loanId;
    if (userId) filter.user = userId;
    if (from || to) {
      filter.dueDate = {};
      if (from) filter.dueDate.$gte = new Date(from);
      if (to) filter.dueDate.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [repayments, total] = await Promise.all([
      Repayment.find(filter)
        .populate('user', 'name email')
        .populate('loan', 'amount status')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Repayment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      repayments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Aggregate repayment stats — Admin/Staff
 * @route   GET /api/repayments/summary
 * @access  Private/Admin
 */
const getRepaymentSummary = async (req, res, next) => {
  try {
    const stats = await Repayment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDue: { $sum: '$amountDue' },
          totalPaid: { $sum: '$amountPaid' },
        },
      },
    ]);

    const summary = {
      totalInstallments: 0,
      totalAmountDue: 0,
      totalAmountPaid: 0,
      totalOutstanding: 0,
      byStatus: {},
    };

    stats.forEach(({ _id, count, totalDue, totalPaid }) => {
      summary.byStatus[_id] = { count, totalDue, totalPaid };
      summary.totalInstallments += count;
      summary.totalAmountDue += totalDue;
      summary.totalAmountPaid += totalPaid;
    });

    summary.totalOutstanding = +(summary.totalAmountDue - summary.totalAmountPaid).toFixed(2);

    res.status(200).json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark a repayment installment as paid
 * @route   PATCH /api/repayments/:id/paid
 * @access  Private/Admin
 */
const markRepaymentPaid = async (req, res, next) => {
  try {
    const { amountPaid, lateFee = 0 } = req.body;

    const repayment = await Repayment.findById(req.params.id).populate('user', 'name email');
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found.' });
    }
    if (repayment.status === 'paid' || repayment.status === 'waived') {
      return res.status(400).json({
        success: false,
        message: `Repayment is already '${repayment.status}'.`,
      });
    }

    repayment.amountPaid = amountPaid ?? repayment.amountDue;
    repayment.lateFee = lateFee;
    repayment.status = 'paid';
    repayment.paidAt = new Date();
    await repayment.save();

    // Notify borrower
    sendEmail({
      to: repayment.user.email,
      subject: `Installment #${repayment.installmentNumber} Paid`,
      text: `Hi ${repayment.user.name}, your installment #${repayment.installmentNumber} of ₹${repayment.amountPaid} has been marked as paid.`,
      html: `<p>Hi <strong>${repayment.user.name}</strong>,</p><p>Your installment <strong>#${repayment.installmentNumber}</strong> of <strong>₹${repayment.amountPaid}</strong> has been marked as <span style="color:green">paid</span>.</p>`,
    }).catch((err) => console.error('Repayment paid email failed:', err));

    res.status(200).json({ success: true, message: 'Repayment marked as paid.', repayment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark a repayment installment as overdue
 * @route   PATCH /api/repayments/:id/overdue
 * @access  Private/Admin
 */
const markRepaymentOverdue = async (req, res, next) => {
  try {
    const { lateFee = 0 } = req.body;

    const repayment = await Repayment.findById(req.params.id).populate('user', 'name email');
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found.' });
    }
    if (repayment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark a '${repayment.status}' repayment as overdue.`,
      });
    }

    repayment.status = 'overdue';
    repayment.lateFee = lateFee;
    await repayment.save();

    // Notify borrower
    sendEmail({
      to: repayment.user.email,
      subject: `⚠️ Installment #${repayment.installmentNumber} Overdue`,
      text: `Hi ${repayment.user.name}, your installment #${repayment.installmentNumber} of ₹${repayment.amountDue} was due on ${repayment.dueDate.toDateString()} and is now overdue.`,
      html: `<p>Hi <strong>${repayment.user.name}</strong>,</p><p>Your installment <strong>#${repayment.installmentNumber}</strong> of <strong>₹${repayment.amountDue}</strong> was due on <strong>${repayment.dueDate.toDateString()}</strong> and is now <span style="color:red">overdue</span>.</p><p>Please make the payment at the earliest to avoid further charges.</p>`,
    }).catch((err) => console.error('Overdue email failed:', err));

    res.status(200).json({ success: true, message: 'Repayment marked as overdue.', repayment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Waive a repayment installment (hardship / write-off)
 * @route   PATCH /api/repayments/:id/waive
 * @access  Private/Admin
 */
const waiveRepayment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const repayment = await Repayment.findById(req.params.id).populate('user', 'name email');
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found.' });
    }
    if (repayment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot waive an already paid installment.' });
    }
    if (repayment.status === 'waived') {
      return res.status(400).json({ success: false, message: 'Installment is already waived.' });
    }

    repayment.status = 'waived';
    repayment.waivedBy = req.user.id;
    repayment.waivedAt = new Date();
    repayment.waiverReason = reason || 'No reason provided.';
    await repayment.save();

    sendEmail({
      to: repayment.user.email,
      subject: `Installment #${repayment.installmentNumber} Waived`,
      text: `Hi ${repayment.user.name}, your installment #${repayment.installmentNumber} of ₹${repayment.amountDue} has been waived.`,
      html: `<p>Hi <strong>${repayment.user.name}</strong>,</p><p>Your installment <strong>#${repayment.installmentNumber}</strong> of <strong>₹${repayment.amountDue}</strong> has been <span style="color:blue">waived</span>.</p>`,
    }).catch((err) => console.error('Waiver email failed:', err));

    res.status(200).json({ success: true, message: 'Repayment waived successfully.', repayment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a pending repayment installment
 * @route   DELETE /api/repayments/:id
 * @access  Private/Admin
 */
const deleteRepayment = async (req, res, next) => {
  try {
    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found.' });
    }
    if (repayment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending repayment installments can be deleted.',
      });
    }

    await repayment.deleteOne();
    res.status(200).json({ success: true, message: 'Repayment deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
