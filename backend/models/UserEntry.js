const mongoose = require('mongoose');

const userEntrySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  company:  { type: String, required: true, trim: true },
  uid:      { type: String },
  xp:       { type: Number, default: 45 },
  blocked:  { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('UserEntry', userEntrySchema);
