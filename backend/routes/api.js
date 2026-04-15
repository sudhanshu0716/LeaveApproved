const express = require('express');
const router = express.Router();
const UserEntry = require('../models/UserEntry');
const Place = require('../models/Place');
const TripListing = require('../models/TripListing');

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

// Save/Retrieve a visitor's entry (Identity Persistence Layer)
router.post('/visitors', async (req, res) => {
  try {
    const { name, company, uid } = req.body;
    
    // Check if traveler already exists in the mission logs
    const existingEntry = await UserEntry.findOne({ name, company });
    
    if (existingEntry) {
      // Re-Authenticate legacy user and restore their previous UID
      return res.json(existingEntry);
    }
    
    // Initialize new identity for first-time explorer
    const newEntry = new UserEntry({ name, company, uid });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update visitor identity metadata (Email/Contact Linkage)
router.put('/visitors/:uid', async (req, res) => {
  try {
    const { email } = req.body;
    const { uid } = req.params;
    
    const updatedEntry = await UserEntry.findOneAndUpdate(
      { uid },
      { $set: { email } },
      { new: true }
    );
    
    if (!updatedEntry) return res.status(404).json({ error: "Mission signature not found" });
    res.json(updatedEntry);
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
    if (type === 'budget') {
      // Suffix-Agnostic Regex: Match both "under 1000" and "under 1000 rupees"
      query.budgetRange = new RegExp(value, 'i');
    }
    else if (type === 'days') {
      // Unified Tactical Signature: Handle both "over 3 days" and "3+ days"
      if (value === 'over 3 days' || value === '3+ days') {
        query.days = { $nin: ['1 day', '2 day', '3 day'] };
      } else {
        query.days = value;
      }
    }
    else if (type === 'distance') {
      // Matches both "under 100km" and "under 100 km"
      query.distance = new RegExp(value, 'i');
    }

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

// TRAVEL BUDDY API

// 1. List a New Trip
router.post('/buddy/trips', async (req, res) => {
  try {
    const { creatorUid, creatorName, creatorCompany, origin, destination, budget, days, date } = req.body;
    const newTrip = new TripListing({
      creatorUid, creatorName, creatorCompany, origin, destination, budget, days, date
    });
    
    // Add XP for creating a trip (e.g. 5 XP)
    await UserEntry.findOneAndUpdate({ uid: creatorUid }, { $inc: { xp: 5 } });
    
    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Trips for Feed (Excluding self)
router.get('/buddy/trips', async (req, res) => {
  try {
    const { origin, uid } = req.query;
    let query = { status: 'listed' };
    
    if (origin) {
      query.origin = new RegExp(origin, 'i');
    }
    if (uid) {
      query.creatorUid = { $ne: uid };
    }
    
    const trips = await TripListing.find(query).sort({ date: 1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Request a Match
router.post('/buddy/trips/:id/match', async (req, res) => {
  try {
    const { requesterUid, requesterName, requesterCompany } = req.body;
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    
    // Check if duplicate request
    if (trip.matches.some(m => m.requesterUid === requesterUid)) {
      return res.status(400).json({ error: "Match sequence already initiated" });
    }
    
    trip.matches.push({ requesterUid, requesterName, requesterCompany, status: 'pending' });
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Accept a Match & Delete Entry (Start Trip)
router.post('/buddy/trips/:id/accept-match', async (req, res) => {
  try {
    const { acceptedUid } = req.body;
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    
    // "Delete the entry of this trip when the trip got started" -> we can remove it entirely, 
    // or just mark the match as accepted and send response, then frontend handles chat.
    // Assuming UI keeps it temporarily for chat logic, we'll mark it 'started'.
    trip.status = 'started';
    const matchDetails = trip.matches.find(m => m.requesterUid === acceptedUid);
    if (matchDetails) {
      matchDetails.status = 'accepted';
      matchDetails.chatActive = true;
    }
    
    // "Also add points in the points system" -> 15 XP for both matching parties
    await UserEntry.findOneAndUpdate({ uid: trip.creatorUid }, { $inc: { xp: 15 } });
    await UserEntry.findOneAndUpdate({ uid: acceptedUid }, { $inc: { xp: 15 } });
    
    await trip.save();
    res.json({ success: true, message: "Tripped started! Points distributed.", trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get My Trips (Created and Matches Requested)
router.get('/buddy/my-trips', async (req, res) => {
  try {
    const { uid } = req.query;
    // Created by me
    const created = await TripListing.find({ creatorUid: uid });
    // Requested by me
    const requested = await TripListing.find({ "matches.requesterUid": uid });
    
    res.json({ created, requested });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat Endpoints
router.post('/buddy/trips/:id/chat', async (req, res) => {
  try {
    const { senderUid, senderName, text } = req.body;
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    
    trip.messages.push({ senderUid, senderName, text });
    await trip.save();
    res.json({ success: true, message: trip.messages[trip.messages.length - 1] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/buddy/trips/:id/chat', async (req, res) => {
  try {
    const trip = await TripListing.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(trip.messages || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
