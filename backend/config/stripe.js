// backend/config/stripe.js
// Stripe SDK initialization and utility helpers
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a PaymentIntent.
 * @param {number} amount - Amount in smallest currency unit (e.g., cents).
 * @param {string} currency - Currency code, default 'usd'.
 * @param {object} [metadata] - Optional metadata for the intent.
 * @returns {Promise<object>} PaymentIntent object.
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });
};

/**
 * Verify Stripe webhook signature.
 * @param {string} payload - Raw request body.
 * @param {string} sigHeader - Value of "Stripe-Signature" header.
 * @returns {object} Verified Stripe event.
 */
const verifyWebhook = (payload, sigHeader) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not set in .env');
  }
  return stripe.webhooks.constructEvent(payload, sigHeader, endpointSecret);
};

module.exports = {
  stripe,
  createPaymentIntent,
  verifyWebhook,
};
