const express = require('express');
const router = express.Router();
const Place = require('../models/Place');

// Get places (with optional filters)
router.get('/places', async (req, res) => {
  try {
    const { type, value } = req.query;
    let query = {};
    if (type === 'budget') {
      query.budgetRange = new RegExp(value, 'i');
    } else if (type === 'days') {
      if (value === 'over 3 days' || value === '3+ days') {
        query.days = { $nin: ['1 day', '2 day', '3 day'] };
      } else {
        query.days = value;
      }
    } else if (type === 'distance') {
      query.distance = new RegExp(value, 'i');
    }
    const places = await Place.find(query);
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like / Unlike toggle
router.post('/places/:id/like', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: 'User required' });
    const place = await Place.findById(req.params.id);
    if (!place.likedBy) place.likedBy = [];
    const index = place.likedBy.indexOf(user);
    if (index === -1) place.likedBy.push(user);
    else place.likedBy.splice(index, 1);
    await place.save();
    res.json({ likedBy: place.likedBy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/places/:id/comment', async (req, res) => {
  try {
    const { user, text } = req.body;
    const place = await Place.findById(req.params.id);
    place.comments.push({ user, text });
    await place.save();
    res.json(place.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete own comment
router.delete('/places/:id/comment/:commentId', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    place.comments = place.comments.filter(c => c._id.toString() !== req.params.commentId);
    await place.save();
    res.json(place.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Places CRUD ────────────────────────────────────────────
router.get('/admin/places', async (req, res) => {
  try {
    res.json(await Place.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/places', async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    res.status(201).json(place);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/places/:id', async (req, res) => {
  try {
    const updated = await Place.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/places/:id', async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Reviews ────────────────────────────────────────────────
router.get('/admin/all-reviews', async (req, res) => {
  try {
    const places = await Place.find();
    const allReviews = [];
    places.forEach(p => {
      p.comments?.forEach(c => {
        allReviews.push({ placeId: p._id, placeName: p.name, _id: c._id, user: c.user, text: c.text, date: c.date });
      });
    });
    res.json(allReviews.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/reviews/:id/:commentId', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });
    place.comments = place.comments.filter(c => c._id.toString() !== req.params.commentId);
    await place.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Social stats
router.get('/admin/social-stats', async (req, res) => {
  try {
    const places = await Place.find();
    const bestPlaces = [...places]
      .sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0))
      .slice(0, 5)
      .map(p => ({ _id: p._id, name: p.name, likes: p.likedBy?.length || 0 }));

    const allReviews = [];
    places.forEach(p => {
      p.comments?.forEach(c => allReviews.push({ placeName: p.name, user: c.user, text: c.text, date: c.date }));
    });
    const latestReviews = allReviews.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    res.json({ bestPlaces, latestReviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
