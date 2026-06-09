// backend/cron/repaymentScheduler.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');

// Helper to access models since they are defined inline in controllers.
// We can import or retrieve the models from mongoose.
const Repayment = mongoose.models.Repayment || mongoose.model('Repayment', new mongoose.Schema({}));

/**
 * startRepaymentScheduler
 * Starts a daily cron job at midnight to scan for pending repayments that are overdue.
 */
const startRepaymentScheduler = () => {
  // Run everyday at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏳ Running scheduled cron job: Checking overdue repayments...');
    try {
      const today = new Date();

      // Find all pending repayments whose due date is in the past
      const overdueRepayments = await Repayment.find({
        status: 'pending',
        dueDate: { $lt: today },
      }).populate('user');

      if (overdueRepayments.length === 0) {
        console.log('✅ No new overdue repayments found.');
        return;
      }

      console.log(`⚠️ Found ${overdueRepayments.length} overdue repayments. Updating status...`);

      for (const repayment of overdueRepayments) {
        repayment.status = 'overdue';
        // Add a default late fee if configured, e.g., ₹100 or 0
        repayment.lateFee = Number(process.env.DEFAULT_LATE_FEE) || 0;
        await repayment.save();

        // Send email notification to user
        if (repayment.user && repayment.user.email) {
          sendEmail({
            to: repayment.user.email,
            subject: `⚠️ Installment #${repayment.installmentNumber} Overdue Notice`,
            text: `Hi ${repayment.user.name}, your installment #${repayment.installmentNumber} of ₹${repayment.amountDue} was due on ${new Date(repayment.dueDate).toDateString()} and is now overdue. Please clear it immediately.`,
            html: `<p>Hi <strong>${repayment.user.name}</strong>,</p>
                   <p>Your installment <strong>#${repayment.installmentNumber}</strong> of <strong>₹${repayment.amountDue}</strong> was due on <strong>${new Date(repayment.dueDate).toDateString()}</strong> and is now <span style="color:red; font-weight:bold;">overdue</span>.</p>
                   <p>A late fee of ₹${repayment.lateFee} has been applied. Please make the payment at the earliest to avoid further collection actions.</p>`,
          }).catch((err) => console.error(`Error sending email to ${repayment.user.email}:`, err));
        }
      }

      console.log(`✅ Finished updating ${overdueRepayments.length} repayments to overdue.`);
    } catch (err) {
      console.error('❌ Error in repayment scheduler:', err);
    }
  });

  console.log('⏰ Repayment Scheduler Cron Job initialized successfully.');
};

module.exports = startRepaymentScheduler;
