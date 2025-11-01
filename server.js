import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Use v1 (not v1beta)
const BASE = "https://generativelanguage.googleapis.com/v1";

// ✅ Default text model (stable)
const DEFAULT_TEXT_MODEL = "models/gemini-1.5-flash";

// -------- TEXT / JSON generation --------
app.post('/api/generate', async (req, res) => {
  try {
    // Allow front-end to optionally pick a model; otherwise use default
    const model = (req.body && typeof req.body.model === 'string' && req.body.model.trim())
      ? req.body.model.trim()
      : DEFAULT_TEXT_MODEL;

    // Build Google endpoint
    const url = `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;

    // Forward the body as-is (but strip the 'model' we handled above to avoid confusion)
    const forwarded = { ...req.body };
    delete forwarded.model;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwarded),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "proxy generate error" });
  }
});

// -------- IMAGE endpoint (placeholder — future) --------
app.post('/api/images', async (_req, res) => {
  return res.json({ message: "Image endpoint coming soon" });
});

// Health check
app.get('/', (_req, res) => res.type('text').send("Chartie proxy OK ✅"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Chartie proxy running on ${PORT}`);
  console.log(`   Default model: ${DEFAULT_TEXT_MODEL}`);
});
