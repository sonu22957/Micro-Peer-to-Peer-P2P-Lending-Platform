// backend/controllers/paymentController.js
const mongoose = require('mongoose');
const { stripe, createPaymentIntent } = require('../config/stripe');
const sendEmail = require('../utils/sendEmail');

// ─── Inline Schemas ───────────────────────────────────────────────────────────
// Replace with:
//   const Payment   = require('../models/Payment');
//   const Loan      = require('../models/Loan');
//   const Repayment = require('../models/Repayment');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    repayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Repayment' }, // optional link to installment
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'inr' },
    method: {
      type: String,
      enum: ['stripe', 'bank_transfer', 'cash', 'other'],
      default: 'stripe',
    },
    stripePaymentIntentId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'verified', 'refunded'],
      default: 'pending',
    },
    notes: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    refundedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

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

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Record / initiate a payment against a disbursed loan
 * @route   POST /api/payments
 * @access  Private
 */
const makePayment = async (req, res, next) => {
  try {
    const { loanId, repaymentId, amount, method = 'stripe', notes, currency = 'inr' } = req.body;

    if (!loanId || !amount) {
      return res.status(400).json({ success: false, message: 'loanId and amount are required.' });
    }

    // Validate the loan belongs to this user and is disbursed
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }
    if (loan.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (loan.status !== 'disbursed') {
      return res.status(400).json({
        success: false,
        message: 'Payments can only be made against disbursed loans.',
      });
    }

    let stripePaymentIntentId;

    // Create a Stripe PaymentIntent for card payments
    if (method === 'stripe') {
      const amountInPaise = Math.round(amount * 100); // Stripe uses smallest currency unit
      const intent = await createPaymentIntent(amountInPaise, currency, {
        loanId: loanId.toString(),
        userId: req.user.id,
      });
      stripePaymentIntentId = intent.id;
    }

    const payment = await Payment.create({
      user: req.user.id,
      loan: loanId,
      repayment: repaymentId || undefined,
      amount,
      currency,
      method,
      stripePaymentIntentId,
      notes,
      paidAt: method !== 'stripe' ? new Date() : undefined,
      status: method !== 'stripe' ? 'pending' : 'pending', // pending until verified
    });

    // If linked to a repayment installment, update it optimistically
    if (repaymentId) {
      await Repayment.findByIdAndUpdate(repaymentId, {
        $inc: { amountPaid: amount },
        paidAt: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      payment,
      ...(stripePaymentIntentId && { clientSecret: `Stripe intent created: ${stripePaymentIntentId}` }),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all payments for the current user (paginated)
 * @route   GET /api/payments/my
 * @access  Private
 */
const getMyPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('loan', 'amount status purpose')
        .populate('repayment', 'installmentNumber dueDate amountDue')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all payments linked to a specific loan
 * @route   GET /api/payments/loan/:loanId
 * @access  Private
 */
const getPaymentsByLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.loanId).lean();
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Users can only view payments on their own loans
    if (req.user.role === 'user' && loan.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const payments = await Payment.find({ loan: req.params.loanId })
      .populate('repayment', 'installmentNumber dueDate')
      .sort({ createdAt: -1 })
      .lean();

    const totalPaid = payments.reduce((sum, p) => sum + (p.status !== 'refunded' ? p.amount : 0), 0);

    res.status(200).json({
      success: true,
      loanId: req.params.loanId,
      totalPaid,
      count: payments.length,
      payments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single payment by ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('loan', 'amount status purpose')
      .populate('repayment', 'installmentNumber dueDate amountDue')
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    if (req.user.role === 'user' && payment.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all payment records — Admin/Staff (paginated + filterable)
 * @route   GET /api/payments
 * @access  Private/Admin
 */
const getAllPayments = async (req, res, next) => {
  try {
    const { status, loanId, userId, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (loanId) filter.loan = loanId;
    if (userId) filter.user = userId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'name email')
        .populate('loan', 'amount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Aggregate payment stats — Admin/Staff
 * @route   GET /api/payments/summary
 * @access  Private/Admin
 */
const getPaymentSummary = async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const summary = { totalPayments: 0, totalAmount: 0, byStatus: {} };
    stats.forEach(({ _id, count, totalAmount }) => {
      summary.byStatus[_id] = { count, totalAmount };
      summary.totalPayments += count;
      if (_id !== 'refunded') summary.totalAmount += totalAmount;
    });

    res.status(200).json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify / confirm a payment after bank reconciliation
 * @route   PATCH /api/payments/:id/verify
 * @access  Private/Admin
 */
const verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify a payment with status '${payment.status}'.`,
      });
    }

    payment.status = 'verified';
    payment.verifiedBy = req.user.id;
    payment.verifiedAt = new Date();
    payment.paidAt = payment.paidAt || new Date();
    await payment.save();

    // If linked to a repayment installment, mark it as paid
    if (payment.repayment) {
      const repayment = await Repayment.findById(payment.repayment);
      if (repayment && repayment.amountPaid >= repayment.amountDue) {
        repayment.status = 'paid';
        repayment.paidAt = new Date();
        await repayment.save();
      }
    }

    // Notify borrower
    sendEmail({
      to: payment.user.email,
      subject: 'Payment Confirmed',
      text: `Hi ${payment.user.name}, your payment of ₹${payment.amount} has been verified and confirmed.`,
      html: `<p>Hi <strong>${payment.user.name}</strong>,</p><p>Your payment of <strong>₹${payment.amount}</strong> has been <span style="color:green">verified</span> successfully.</p>`,
    }).catch((err) => console.error('Payment verification email failed:', err));

    res.status(200).json({ success: true, message: 'Payment verified.', payment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Refund a verified payment
 * @route   PATCH /api/payments/:id/refund
 * @access  Private/Admin
 */
const refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    if (payment.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Only verified payments can be refunded.',
      });
    }

    // Attempt Stripe refund if applicable
    if (payment.method === 'stripe' && payment.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr.message);
        return res.status(502).json({ success: false, message: `Stripe refund failed: ${stripeErr.message}` });
      }
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    // Reverse the repayment installment if linked
    if (payment.repayment) {
      await Repayment.findByIdAndUpdate(payment.repayment, {
        $inc: { amountPaid: -payment.amount },
        status: 'pending',
        paidAt: null,
      });
    }

    sendEmail({
      to: payment.user.email,
      subject: 'Payment Refunded',
      text: `Hi ${payment.user.name}, your payment of ₹${payment.amount} has been refunded.`,
      html: `<p>Hi <strong>${payment.user.name}</strong>,</p><p>Your payment of <strong>₹${payment.amount}</strong> has been <span style="color:orange">refunded</span>. Please allow 3–5 business days for the amount to reflect.</p>`,
    }).catch((err) => console.error('Refund email failed:', err));

    res.status(200).json({ success: true, message: 'Payment refunded successfully.', payment });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a pending (unverified) payment record
 * @route   DELETE /api/payments/:id
 * @access  Private/Admin
 */
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be deleted.',
      });
    }

    await payment.deleteOne();
    res.status(200).json({ success: true, message: 'Payment deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  makePayment,
  getPaymentById,
  getMyPayments,
  getPaymentsByLoan,
  getAllPayments,
  verifyPayment,
  refundPayment,
  deletePayment,
  getPaymentSummary,
};
