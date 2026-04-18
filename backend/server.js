const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io accessible to routes
app.set('io', io);

app.use(cors());
app.use(express.json());

// ── Rate limiting ────────────────────────────────────────────────
// Strict limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  message: { error: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/places'));
app.use('/api/buddy', require('./routes/buddy'));
app.use('/api', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api', require('./routes/contact'));
app.use('/api', require('./routes/demo'));

// ── XP sync ─────────────────────────────────────────────────────
const UserEntry = require('./models/UserEntry');
const { verifyToken } = require('./middleware/auth');
app.patch('/api/visitors/:uid/xp', verifyToken, async (req, res) => {
  try {
    const { xp } = req.body;
    if (typeof xp !== 'number') return res.status(400).json({ error: 'xp must be a number' });
    const user = await UserEntry.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: { xp } },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ xp: user.xp });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// ── Socket.io ────────────────────────────────────────────────────
const TripListing = require('./models/TripListing');

io.on('connection', (socket) => {
  // Join a trip chat room
  socket.on('join-room', (tripId) => {
    socket.join(tripId);
  });

  // Send a message — save to DB then broadcast
  socket.on('send-message', async ({ tripId, senderUid, senderName, text }) => {
    try {
      const trip = await TripListing.findById(tripId);
      if (!trip) return;
      trip.messages.push({ senderUid, senderName, text });
      await trip.save();
      const saved = trip.messages[trip.messages.length - 1];
      io.to(tripId).emit('new-message', saved);
    } catch (err) {
      console.error('Socket send-message error:', err.message);
    }
  });

  socket.on('leave-room', (tripId) => {
    socket.leave(tripId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
