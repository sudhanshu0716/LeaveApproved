const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const { verifyAdmin } = require('../middleware/auth');

// POST /api/contact — any visitor can send a message (auth optional)
router.post('/contact', async (req, res) => {
  try {
    const { message, name } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });

    // Try to extract user from token if present (optional auth)
    let userName = name || 'Anonymous';
    let uid = '';
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const SECRET = process.env.JWT_SECRET || 'fallback_secret';
        const decoded = jwt.verify(auth.slice(7), SECRET);
        userName = decoded.username || userName;
        uid = decoded.uid || '';
      } catch (_) { /* token invalid or missing — still allow */ }
    }

    const doc = new ContactMessage({ name: userName, uid, message: message.trim() });
    await doc.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/queries — admin gets all messages
router.get('/admin/queries', verifyAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/queries/:id/read — mark as read
router.patch('/admin/queries/:id/read', verifyAdmin, async (req, res) => {
  try {
    await ContactMessage.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/queries/:id
router.delete('/admin/queries/:id', verifyAdmin, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
