const express = require('express');
const router = express.Router();

// AI generation — routes strictly to the model the user selected
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;

    // ── GEMINI ────────────────────────────────────────────────────────────────
    if (model === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return res.status(500).json({ error: 'Gemini API key not configured.' });

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      return res.json(await geminiRes.json());
    }

    // ── GROQ (default) ────────────────────────────────────────────────────────
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'Groq API key not configured.' });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    });
    const groqData = await groqRes.json();
    if (!groqData.choices?.[0]) return res.status(500).json({ error: groqData.error?.message || 'Groq returned no response.' });

    // Normalise to Gemini candidates shape so the frontend parser works for both
    return res.json({ candidates: [{ content: { parts: [{ text: groqData.choices[0].message.content }] } }] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
