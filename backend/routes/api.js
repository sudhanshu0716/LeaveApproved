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
    else if (type === 'days') query.days = value;
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

// Admin: Update Place
router.put('/admin/places/:id', async (req, res) => {
  try {
    const updatedPlace = await Place.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

// User: Like a place
router.post('/places/:id/like', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    place.likes = (place.likes || 0) + 1;
    await place.save();
    res.json({ likes: place.likes });
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

module.exports = router;
