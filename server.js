import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// Allow CORS during testing. You can restrict origins later.
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Use v1beta (current features + 2.5 models live here)
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ✅ Pick a live model (2.5). You can also try: gemini-2.5-flash, gemini-2.5-flash-lite
const TEXT_MODEL = 'models/gemini-2.5-flash';

// -------------- TEXT / JSON generation --------------
app.post('/api/generate', async (req, res) => {
  try {
    // Allow the client to override model if it sends one; otherwise use default.
    const model = req.body?.model || TEXT_MODEL;

    const url = `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;
    const forwardBody = { ...req.body };
    // Ensure we don't accidentally double-nest model in the body.
    delete forwardBody.model;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardBody),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'proxy generate error' });
  }
});

// -------------- IMAGE generation (placeholder) --------------
app.post('/api/images', async (_req, res) => {
  // You can wire this later to Imagen once you’re ready.
  return res.json({ message: 'Image endpoint coming soon' });
});

// -------------- Health check --------------
app.get('/', (_req, res) => res.type('text').send('Chartie proxy OK ✅ (v1beta • 2.5 models)'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Chartie proxy running on ${PORT}`));
