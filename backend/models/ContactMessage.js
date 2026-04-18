const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name:    { type: String, default: 'Anonymous' },
  uid:     { type: String, default: '' },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactSchema);
