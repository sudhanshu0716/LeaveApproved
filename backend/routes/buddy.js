const express = require('express');
const router = express.Router();
const TripListing = require('../models/TripListing');
const Contribution = require('../models/Contribution');
const UserEntry = require('../models/UserEntry');
const { verifyToken } = require('../middleware/auth');

// List a new trip (authenticated)
router.post('/trips', verifyToken, async (req, res) => {
  try {
    const { creatorName, creatorCompany, origin, destination, budget, days, date, maxBuddies } = req.body;
    const creatorUid = req.user.uid;
    const newTrip = new TripListing({ creatorUid, creatorName, creatorCompany, origin, destination, budget, days, date, maxBuddies: maxBuddies || 3 });
    await UserEntry.findOneAndUpdate({ uid: creatorUid }, { $inc: { xp: 5 } });
    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get trip feed (excluding self)
router.get('/trips', async (req, res) => {
  try {
    const { origin, uid } = req.query;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let query = { status: 'listed', date: { $gte: yesterday } };
    if (origin) query.origin = new RegExp(origin, 'i');
    if (uid) query.creatorUid = { $ne: uid };
    const trips = await TripListing.find(query).sort({ date: 1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request a match (authenticated)
router.post('/trips/:id/match', verifyToken, async (req, res) => {
  try {
    const { requesterName, requesterCompany } = req.body;
    const requesterUid = req.user.uid;
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.matches.some(m => m.requesterUid === requesterUid))
      return res.status(400).json({ error: 'Match sequence already initiated' });
    const acceptedCount = trip.matches.filter(m => m.status === 'accepted').length;
    if (acceptedCount >= (trip.maxBuddies || 3))
      return res.status(400).json({ error: 'Trip is full' });
    trip.matches.push({ requesterUid, requesterName, requesterCompany, status: 'pending' });
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept a match (authenticated)
router.post('/trips/:id/accept-match', verifyToken, async (req, res) => {
  try {
    const { acceptedUid } = req.body;
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const matchDetails = trip.matches.find(m => m.requesterUid === acceptedUid);
    if (matchDetails) { matchDetails.status = 'accepted'; matchDetails.chatActive = true; }
    await UserEntry.findOneAndUpdate({ uid: trip.creatorUid }, { $inc: { xp: 15 } });
    await UserEntry.findOneAndUpdate({ uid: acceptedUid }, { $inc: { xp: 15 } });
    await trip.save();
    res.json({ success: true, message: 'Trip started! Points distributed.', trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my trips
router.get('/my-trips', async (req, res) => {
  try {
    const { uid } = req.query;
    const created = await TripListing.find({ creatorUid: uid });
    const requested = await TripListing.find({ 'matches.requesterUid': uid });
    res.json({ created, requested });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a trip (authenticated, owner only)
router.delete('/trips/:id', verifyToken, async (req, res) => {
  try {
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.creatorUid !== req.user.uid) return res.status(403).json({ error: 'Not authorized' });
    await TripListing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat: send message (authenticated)
router.post('/trips/:id/chat', verifyToken, async (req, res) => {
  try {
    const { senderUid, senderName, text } = req.body;
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    trip.messages.push({ senderUid, senderName, text });
    await trip.save();
    res.json({ success: true, message: trip.messages[trip.messages.length - 1] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat: get messages
router.get('/trips/:id/chat', async (req, res) => {
  try {
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip.messages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a contribution (authenticated)
router.post('/contribute', verifyToken, async (req, res) => {
  try {
    const { userName, text } = req.body;
    if (!userName || !text) return res.status(400).json({ error: 'Name and itinerary text are required.' });
    const contribution = new Contribution({ userName, text });
    await contribution.save();
    res.status(201).json(contribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
