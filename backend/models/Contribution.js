const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  text: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contribution', ContributionSchema);
