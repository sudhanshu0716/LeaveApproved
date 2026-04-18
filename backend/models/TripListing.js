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
  matches: [matchRequestSchema],
  messages: [chatMessageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TripListing', tripListingSchema);
