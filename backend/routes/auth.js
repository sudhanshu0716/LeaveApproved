const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const UserEntry = require('../models/UserEntry');
const { signToken, verifyToken } = require('../middleware/auth');

function validatePassword(password) {
  const checks = [
    { ok: password.length >= 8,          msg: 'At least 8 characters' },
    { ok: /[A-Z]/.test(password),        msg: 'At least one uppercase letter (A-Z)' },
    { ok: /[a-z]/.test(password),        msg: 'At least one lowercase letter (a-z)' },
    { ok: /[0-9]/.test(password),        msg: 'At least one number (0-9)' },
    { ok: /[^A-Za-z0-9]/.test(password), msg: 'At least one special character (!@#$%...)' },
  ];
  return checks.filter(c => !c.ok).map(c => c.msg);
}

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, company } = req.body;
    if (!username || !email || !password || !company)
      return res.status(400).json({ error: 'All fields are required.' });

    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0)
      return res.status(400).json({ error: 'Password too weak: ' + pwdErrors[0] });

    if (username.length < 3)
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });

    const exists = await UserEntry.findOne({ $or: [{ email: email.toLowerCase() }, { username: { $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }] });
    if (exists) {
      const field = exists.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} is already taken.` });
    }

    const hashed = await bcrypt.hash(password, 12);
    const uid = `VOY-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const user = new UserEntry({ username, email: email.toLowerCase(), password: hashed, company, uid });
    await user.save();

    const token = signToken({ uid: user.uid, username: user.username, role: 'user' });
    res.status(201).json({ token, uid: user.uid, username: user.username, company: user.company, xp: user.xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password)
      return res.status(400).json({ error: 'Username/email and password are required.' });

    const user = await UserEntry.findOne({ $or: [{ username: { $regex: `^${login.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }, { email: login.toLowerCase() }] });
    if (!user) return res.status(401).json({ error: 'No account found with that username or email.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password.' });

    if (user.blocked) return res.status(403).json({ error: 'Your account has been suspended. Please contact the admin.' });

    const token = signToken({ uid: user.uid, username: user.username, role: 'user' });
    res.json({ token, uid: user.uid, username: user.username, name: user.username, company: user.company, xp: user.xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USER || 'sudh';
  const validPass = process.env.ADMIN_PASS || 'su';
  if (username === validUser && password === validPass) {
    const token = signToken({ username, role: 'admin' }, '1d');
    res.json({ success: true, token, message: 'Access Granted' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Credentials' });
  }
});

// Get user profile (protected)
router.get('/visitors/:uid', verifyToken, async (req, res) => {
  try {
    const user = await UserEntry.findOne({ uid: req.params.uid }, '-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile email (protected)
router.put('/visitors/:uid', verifyToken, async (req, res) => {
  try {
    const { email } = req.body;
    const updated = await UserEntry.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: { email: email?.toLowerCase() } },
      { new: true, select: '-password' }
    );
    if (!updated) return res.status(404).json({ error: 'User not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
