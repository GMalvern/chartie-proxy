/* server.js — same-origin Express server + proxy for Gemini */
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// node-fetch v3 (ESM) shim for CommonJS:
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();

// ---- Config
const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.CHARTIE_MODEL || 'models/gemini-2.5-flash';

// ---- Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// rate limit for /api
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
}));

// ---- API
app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(GOOGLE_API_KEY) });
});

app.post('/api/generate', async (req, res) => {
  try {
    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: { message: 'Missing GOOGLE_API_KEY' } });
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${encodeURIComponent(GOOGLE_API_KEY)}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });

    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(data);
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: { message: 'Proxy failure', detail: String(err && err.message || err) } });
  }
});

// ---- Static app
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));
// SPA-style fallback to index
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

// ---- Start
app.listen(PORT, () => {
  console.log(`Chartie running on http://localhost:${PORT}`);
});
