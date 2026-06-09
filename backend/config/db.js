// config/db.js
// MongoDB connection using Mongoose
require('dotenv').config();

// this normal comment is added to test the commit and push functionality of git
const mongoose = require('mongoose');

const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/loan_management';

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Event listeners for better debugging
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to', dbUrl);
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected');
});

module.exports = connectDB;
