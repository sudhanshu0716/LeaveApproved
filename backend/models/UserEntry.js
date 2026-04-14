const mongoose = require('mongoose');

const userEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, default: '' },
  uid: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserEntry', userEntrySchema);
