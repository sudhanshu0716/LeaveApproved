const express = require('express');
const router = express.Router();

// AI generation proxy (Groq primary, Gemini fallback)
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (model !== 'gemini' && groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });
        const data = await groqRes.json();
        if (data.choices?.[0]) {
          return res.json({ candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] });
        }
      } catch (e) {
        console.error('Groq failed, falling back to Gemini:', e.message);
      }
    }

    if (!geminiKey) return res.status(500).json({ error: 'No AI API keys configured.' });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    );
    res.json(await geminiRes.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
