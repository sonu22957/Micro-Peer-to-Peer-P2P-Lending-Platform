// backend/controllers/loanController.js
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');

// ─── Inline Schemas ───────────────────────────────────────────────────────────
// Replace with: const Loan = require('../models/Loan');
//               const Repayment = require('../models/Repayment');

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1000 },
    interestRate: { type: Number, required: true }, // annual % e.g. 12 = 12%
    termMonths: { type: Number, required: true, min: 1 },
    purpose: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'disbursed', 'closed'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);
const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);

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

// ─── EMI Helper ───────────────────────────────────────────────────────────────

/**
 * Calculate fixed monthly EMI using the standard amortisation formula.
 * EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 * @param {number} principal   - Loan amount
 * @param {number} annualRate  - Annual interest rate (e.g. 12 for 12%)
 * @param {number} termMonths  - Loan tenure in months
 * @returns {number} Monthly EMI (rounded to 2 dp)
 */
const calculateEMI = (principal, annualRate, termMonths) => {
  const r = annualRate / 100 / 12; // monthly rate
  if (r === 0) return +(principal / termMonths).toFixed(2);
  const emi = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  return +emi.toFixed(2);
};

/**
 * Build a full amortisation schedule array.
 * @returns {Array} Array of installment objects with dueDate, principal, interest, emi, balance
 */
const buildSchedule = (principal, annualRate, termMonths, startDate = new Date()) => {
  const r = annualRate / 100 / 12;
  const emi = calculateEMI(principal, annualRate, termMonths);
  const schedule = [];
  let balance = principal;

  for (let i = 1; i <= termMonths; i++) {
    const interest = +(balance * r).toFixed(2);
    const principalPart = +(emi - interest).toFixed(2);
    balance = +(balance - principalPart).toFixed(2);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      emi,
      principal: principalPart,
      interest,
      closingBalance: balance < 0 ? 0 : balance,
    });
  }
  return schedule;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Apply for a new loan
 * @route   POST /api/loans/apply
 * @access  Private
 */
const applyForLoan = async (req, res, next) => {
  try {
    const { amount, interestRate, termMonths, purpose } = req.body;

    if (!amount || !interestRate || !termMonths) {
      return res.status(400).json({
        success: false,
        message: 'Amount, interest rate, and term (months) are required.',
      });
    }

    const loan = await Loan.create({
      user: req.user.id,
      amount,
      interestRate,
      termMonths,
      purpose,
    });

    res.status(201).json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all loans for the current user (paginated + filterable)
 * @route   GET /api/loans/my
 * @access  Private
 */
const getMyLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [loans, total] = await Promise.all([
      Loan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
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
 * @desc    Get all loan applications — Admin/Staff only (paginated + filterable)
 * @route   GET /api/loans
 * @access  Private/Admin
 */
const getAllLoans = async (req, res, next) => {
  try {
    const { status, userId, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.user = userId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [loans, total] = await Promise.all([
      Loan.find(filter)
        .populate('user', 'name email')
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
 * @desc    Get a single loan by ID
 * @route   GET /api/loans/:id
 * @access  Private (user sees own; admin sees any)
 */
const getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('user', 'name email').lean();

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Non-admin users can only view their own loans
    if (req.user.role === 'user' && loan.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get EMI repayment schedule for a loan
 * @route   GET /api/loans/:id/schedule
 * @access  Private
 */
const getLoanSchedule = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).lean();

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    if (req.user.role === 'user' && loan.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const startDate = loan.disbursedAt || loan.createdAt;
    const schedule = buildSchedule(loan.amount, loan.interestRate, loan.termMonths, startDate);
    const emi = calculateEMI(loan.amount, loan.interestRate, loan.termMonths);
    const totalPayable = +(emi * loan.termMonths).toFixed(2);
    const totalInterest = +(totalPayable - loan.amount).toFixed(2);

    res.status(200).json({
      success: true,
      loanId: loan._id,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      emi,
      totalPayable,
      totalInterest,
      schedule,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a loan (only while pending)
 * @route   PUT /api/loans/:id
 * @access  Private
 */
const updateLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (loan.user.toString() !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan cannot be updated in '${loan.status}' status. Only pending loans can be edited.`,
      });
    }

    const { amount, interestRate, termMonths, purpose } = req.body;
    if (amount) loan.amount = amount;
    if (interestRate) loan.interestRate = interestRate;
    if (termMonths) loan.termMonths = termMonths;
    if (purpose !== undefined) loan.purpose = purpose;

    await loan.save();
    res.status(200).json({ success: true, loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Approve a pending loan
 * @route   PATCH /api/loans/:id/approve
 * @access  Private/Admin
 */
const approveLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('user', 'name email');

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (loan.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a loan with status '${loan.status}'.` });
    }

    loan.status = 'approved';
    loan.approvedBy = req.user.id;
    await loan.save();

    // Notify borrower
    sendEmail({
      to: loan.user.email,
      subject: 'Your Loan Application Has Been Approved!',
      text: `Hi ${loan.user.name}, congratulations! Your loan application for ₹${loan.amount} has been approved.`,
      html: `<p>Hi <strong>${loan.user.name}</strong>,</p><p>Your loan application for <strong>₹${loan.amount}</strong> has been <span style="color:green">approved</span>. Disbursement will follow shortly.</p>`,
    }).catch((err) => console.error('Loan approval email failed:', err));

    res.status(200).json({ success: true, message: 'Loan approved successfully.', loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reject a pending loan with a reason
 * @route   PATCH /api/loans/:id/reject
 * @access  Private/Admin
 */
const rejectLoan = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const loan = await Loan.findById(req.params.id).populate('user', 'name email');

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (!['pending', 'approved'].includes(loan.status)) {
      return res.status(400).json({ success: false, message: `Cannot reject a loan with status '${loan.status}'.` });
    }

    loan.status = 'rejected';
    loan.rejectionReason = reason || 'No reason provided.';
    await loan.save();

    sendEmail({
      to: loan.user.email,
      subject: 'Loan Application Update',
      text: `Hi ${loan.user.name}, unfortunately your loan application for ₹${loan.amount} was not approved. Reason: ${loan.rejectionReason}`,
      html: `<p>Hi <strong>${loan.user.name}</strong>,</p><p>We regret to inform you that your loan application for <strong>₹${loan.amount}</strong> has been <span style="color:red">rejected</span>.</p><p><strong>Reason:</strong> ${loan.rejectionReason}</p>`,
    }).catch((err) => console.error('Loan rejection email failed:', err));

    res.status(200).json({ success: true, message: 'Loan rejected.', loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Disburse an approved loan and auto-generate repayment schedule
 * @route   PATCH /api/loans/:id/disburse
 * @access  Private/Admin
 */
const disburseLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('user', 'name email');

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (loan.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved loans can be disbursed.' });
    }

    loan.status = 'disbursed';
    loan.disbursedAt = new Date();
    await loan.save();

    // Auto-generate repayment installment records
    const schedule = buildSchedule(loan.amount, loan.interestRate, loan.termMonths, loan.disbursedAt);
    const repaymentDocs = schedule.map((inst) => ({
      user: loan.user._id,
      loan: loan._id,
      installmentNumber: inst.installmentNumber,
      amountDue: inst.emi,
      dueDate: inst.dueDate,
      status: 'pending',
    }));
    await Repayment.insertMany(repaymentDocs);

    sendEmail({
      to: loan.user.email,
      subject: 'Loan Disbursed — Repayment Schedule Ready',
      text: `Hi ${loan.user.name}, your loan of ₹${loan.amount} has been disbursed. Please check your repayment schedule in the dashboard.`,
      html: `<p>Hi <strong>${loan.user.name}</strong>,</p><p>Your loan of <strong>₹${loan.amount}</strong> has been <span style="color:green">disbursed</span>. Your first EMI is due on <strong>${schedule[0].dueDate.toDateString()}</strong>.</p>`,
    }).catch((err) => console.error('Disbursement email failed:', err));

    res.status(200).json({ success: true, message: 'Loan disbursed and repayment schedule created.', loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Close a fully repaid loan
 * @route   PATCH /api/loans/:id/close
 * @access  Private/Admin
 */
const closeLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (loan.status !== 'disbursed') {
      return res.status(400).json({ success: false, message: 'Only disbursed loans can be closed.' });
    }

    // Verify no outstanding repayments remain
    const outstanding = await Repayment.countDocuments({
      loan: loan._id,
      status: { $in: ['pending', 'overdue'] },
    });
    if (outstanding > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot close loan — ${outstanding} repayment(s) are still outstanding.`,
      });
    }

    loan.status = 'closed';
    loan.closedAt = new Date();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan closed successfully.', loan });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a loan (only pending or rejected)
 * @route   DELETE /api/loans/:id
 * @access  Private/Admin
 */
const deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (!['pending', 'rejected'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or rejected loans can be deleted.',
      });
    }

    await loan.deleteOne();
    res.status(200).json({ success: true, message: 'Loan deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get aggregate loan stats — Admin/Staff only
 * @route   GET /api/loans/summary
 * @access  Private/Admin
 */
const getLoanSummary = async (req, res, next) => {
  try {
    const stats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const summary = { totalLoans: 0, totalAmount: 0, byStatus: {} };
    stats.forEach(({ _id, count, totalAmount }) => {
      summary.byStatus[_id] = { count, totalAmount };
      summary.totalLoans += count;
      summary.totalAmount += totalAmount;
    });

    res.status(200).json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
