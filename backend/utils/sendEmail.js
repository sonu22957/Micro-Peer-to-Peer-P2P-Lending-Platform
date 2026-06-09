// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * sendEmail
 * Sends a transactional email via Nodemailer using SMTP credentials from .env
 *
 * Required env vars:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 *
 * @param {object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text    - Plain-text body (fallback)
 * @param {string} [options.html]  - HTML body (optional, preferred if provided)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, // true for port 465, false for others
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Loan Management" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    ...(html && { html }),
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
