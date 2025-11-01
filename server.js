import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Gemini API base
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Default model (you can override later if needed)
const TEXT_MODEL = process.env.GEMINI_MODEL || "models/gemini-1.5-flash";

// ---- Text / JSON generation ----
app.post('/api/generate', async (req, res) => {
  try {
    const model = req.body.model || TEXT_MODEL;
    const url = `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await r.json();
    res.status(r.status).json(data);

  } catch (e) {
    res.status(500).json({ error: e.message || 'proxy generate error' });
  }
});

// ---- Image generation (Imagen) ----
app.post('/api/images', async (req, res) => {
  try {
    const url = `${BASE}/images:generate?key=${process.env.GOOGLE_AI_KEY}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await r.json();
    res.status(r.status).json(data);

  } catch (e) {
    res.status(500).json({ error: e.message || 'proxy image error' });
  }
});

// ---- Health check ----
app.get('/', (_req, res) => res.type('text').send('Chartie proxy OK'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Chartie proxy listening on ${PORT}`));
