const express = require('express');
const router = express.Router();
const https = require('https');
const UserEntry = require('../models/UserEntry');
const Contribution = require('../models/Contribution');

// ── Live Visitor Tracking (in-memory) ────────────────────────────
const activeSessions = new Map();

router.post('/heartbeat', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) activeSessions.set(sessionId, Date.now());
  res.json({ ok: true });
});

router.get('/active-users', (req, res) => {
  const cutoff = Date.now() - 2 * 60 * 1000;
  let count = 0;
  for (const [id, ts] of activeSessions.entries()) {
    if (ts < cutoff) activeSessions.delete(id);
    else count++;
  }
  res.json({ count });
});

// ── Analytics ────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    res.json(await UserEntry.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UptimeRobot Status ───────────────────────────────────────────
router.get('/admin/uptime', async (req, res) => {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  const monitorId = process.env.UPTIMEROBOT_MONITOR_ID || '802847392';
  if (!apiKey) return res.status(503).json({ error: 'UPTIMEROBOT_API_KEY not set' });

  const body = new URLSearchParams({
    api_key: apiKey,
    monitors: monitorId,
    response_times: '1',
    response_times_limit: '10',
    custom_uptime_ratios: '1-7-30',
    format: 'json'
  }).toString();

  const options = {
    hostname: 'api.uptimerobot.com',
    path: '/v2/getMonitors',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
  };

  const request = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.stat !== 'ok' || !parsed.monitors?.length)
          return res.json({ error: parsed.error || 'No monitors found' });
        const m = parsed.monitors[0];
        const ratios = (m.custom_uptime_ratio || '').split('-');
        const times = (m.response_times || []).map(t => t.value);
        res.json({
          status: m.status,
          statusText: m.status === 2 ? 'Up' : m.status === 9 ? 'Down' : 'Paused',
          uptime24h: ratios[0] || null,
          uptime7d: ratios[1] || null,
          uptime30d: ratios[2] || null,
          avgResponse: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
          minResponse: times.length ? Math.min(...times) : null,
          maxResponse: times.length ? Math.max(...times) : null,
          url: m.url,
          name: m.friendly_name,
        });
      } catch (e) {
        res.json({ error: 'Parse error: ' + e.message });
      }
    });
  });
  request.on('error', (e) => res.json({ error: e.message }));
  request.write(body);
  request.end();
});

// ── Contributions ─────────────────────────────────────────────────
router.get('/admin/contributions', async (req, res) => {
  try {
    res.json(await Contribution.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/contributions/:id', async (req, res) => {
  try {
    const updated = await Contribution.findByIdAndUpdate(req.params.id, { status: 'processed' }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/contributions/:id', async (req, res) => {
  try {
    await Contribution.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
