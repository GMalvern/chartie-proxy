import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// Allow calls from anywhere while you test.
// (Later you can restrict: app.use(cors({ origin: [/chartieapp\.com$/, /localhost/] }));)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const TEXT_MODEL = 'gemini-1.5-flash-latest'; // ✅ valid for :generateContent

// ---- Text / JSON generation (Gemini) ----
app.post('/api/generate', async (req, res) => {
  try {
    const url = `${BASE}/models/${TEXT_MODEL}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'proxy generate error' });
  }
});

// ---- Image generation (Imagen) ----
// Endpoint: v1beta/images:generate  (returns { images: [ { byteB64 } ] })
app.post('/api/images', async (req, res) => {
  try {
    const url = `${BASE}/images:generate?key=${process.env.GOOGLE_AI_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'proxy image error' });
  }
});

// Optional: serve a basic health check
app.get('/', (_req, res) => res.type('text').send('Chartie proxy OK'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Chartie proxy listening on ${PORT}`));
