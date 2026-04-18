const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
