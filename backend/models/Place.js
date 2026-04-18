const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  from: { type: String },
  description: { type: String },
  budgetRange: { type: String }, // e.g., '2500'
  days: { type: String }, // e.g., '2'
  distance: { type: String }, // e.g., '100'
  nodes: { type: Array, default: [] },
  edges: { type: Array, default: [] },
  components: {
    transport: { type: String },
    food: { type: String },
    rooms: { type: String }
  },
  imageUrl: { type: String },
  likedBy: [{ type: String }], 
  comments: [{
    user: String,
    text: String,
    date: { type: Date, default: Date.now }
  }]
});

// Indexes for fast filtering at scale
placeSchema.index({ budgetRange: 1 });
placeSchema.index({ days: 1 });
placeSchema.index({ distance: 1 });
placeSchema.index({ name: 'text', description: 'text' }); // full-text search

module.exports = mongoose.model('Place', placeSchema);
