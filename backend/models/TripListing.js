const mongoose = require('mongoose');

const matchRequestSchema = new mongoose.Schema({
  requesterUid: { type: String, required: true },
  requesterName: { type: String, required: true },
  requesterCompany: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  chatActive: { type: Boolean, default: false }
}, { _id: true });

const chatMessageSchema = new mongoose.Schema({
  senderUid: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  paidByName: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { _id: true });

const tripListingSchema = new mongoose.Schema({
  creatorUid: { type: String, required: true },
  creatorName: { type: String, required: true },
  creatorCompany: { type: String },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  budget: { type: String, required: true },
  days: { type: String, required: true },
  date: { type: Date, required: true, expires: 1209600 },
  maxBuddies: { type: Number, default: 3, min: 1, max: 20 },
  status: { type: String, enum: ['listed', 'started'], default: 'listed' },
  tags: [{ type: String }],
  matches: [matchRequestSchema],
  messages: [chatMessageSchema],
  expenses: [expenseSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TripListing', tripListingSchema);
