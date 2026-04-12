const express = require('express');
const router = express.Router();
const UserEntry = require('../models/UserEntry');
const Place = require('../models/Place');

// Admin: Secure Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USER || 'sudh';
  const validPass = process.env.ADMIN_PASS || 'su';

  if (username === validUser && password === validPass) {
    res.json({ success: true, message: "Access Granted" });
  } else {
    res.status(401).json({ success: false, message: "Invalid Credentials" });
  }
});

// Save a visitor's entry
router.post('/visitors', async (req, res) => {
  try {
    const { name, company } = req.body;
    const newEntry = new UserEntry({ name, company });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Analytics
router.get('/analytics', async (req, res) => {
  try {
    const entries = await UserEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET places based on criteria
router.get('/places', async (req, res) => {
  try {
    const { type, value } = req.query; 
    let query = {};
    if (type === 'budget') query.budgetRange = value;
    else if (type === 'days') {
      if (value === 'over 3 days') {
        query.days = { $nin: ['1 day', '2 day', '3 day'] };
      } else {
        query.days = value;
      }
    }
    else if (type === 'distance') query.distance = value;

    const places = await Place.find(query);
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: GET all places
router.get('/admin/places', async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add a place
router.post('/admin/places', async (req, res) => {
  try {
    const newPlace = new Place(req.body);
    await newPlace.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update Place (Protected from overwriting social data)
router.put('/admin/places/:id', async (req, res) => {
  try {
    const updatedPlace = await Place.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, // Only update fields present in the body
      { new: true }
    );
    res.json(updatedPlace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete Place
router.delete('/admin/places/:id', async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User: Like/Unlike Toggle a place
router.post('/places/:id/like', async (req, res) => {
  try {
    const { user } = req.body;
    if (!user) return res.status(400).json({ error: "User required" });
    
    const place = await Place.findById(req.params.id);
    if (!place.likedBy) place.likedBy = [];
    
    const index = place.likedBy.indexOf(user);
    if (index === -1) {
      place.likedBy.push(user);
    } else {
      place.likedBy.splice(index, 1);
    }
    
    await place.save();
    res.json({ likedBy: place.likedBy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User: Comment on a place
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

// User: Remove their own comment
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

// Proxy for AI Generation (Supports Groq or Gemini)
router.post('/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Try Groq first (Fastest & Free)
    if (groqKey) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1
          })
        });

        const groqData = await groqResponse.json();
        if (groqData.choices && groqData.choices[0]) {
          // Translate Groq response to Gemini structure for Frontend compatibility
          return res.json({
            candidates: [{
              content: {
                parts: [{ text: groqData.choices[0].message.content }]
              }
            }]
          });
        }
      } catch (e) {
        console.error("Groq Failed, falling back to Gemini:", e);
      }
    }

    // 2. Fallback to Gemini
    if (!geminiKey) return res.status(500).json({ error: "No AI API keys configured." });

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiResponse.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get All Reviews globally for moderation
router.get('/admin/all-reviews', async (req, res) => {
  try {
    const places = await Place.find();
    let allReviews = [];
    places.forEach(p => {
      p.comments?.forEach(c => {
        allReviews.push({
          placeId: p._id,
          placeName: p.name,
          _id: c._id,
          user: c.user,
          text: c.text,
          date: c.date
        });
      });
    });
    res.json(allReviews.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete any review
router.delete('/admin/reviews/:id/:commentId', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    place.comments = place.comments.filter(c => c._id.toString() !== req.params.commentId);
    await place.save();
    res.json({ success: true, message: "Review purged" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get Social Stats (Top Liked & Latest Reviews)
router.get('/admin/social-stats', async (req, res) => {
  try {
    const places = await Place.find();
    
    // Sort by likes (likedBy array length)
    const bestPlaces = [...places]
      .sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0))
      .slice(0, 5)
      .map(p => ({
        _id: p._id,
        name: p.name,
        likes: p.likedBy?.length || 0
      }));

    // Get all comments and sort by date
    let allReviews = [];
    places.forEach(p => {
      p.comments?.forEach(c => {
        allReviews.push({
          placeName: p.name,
          user: c.user,
          text: c.text,
          date: c.date
        });
      });
    });

    const latestReviews = allReviews
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({ bestPlaces, latestReviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
