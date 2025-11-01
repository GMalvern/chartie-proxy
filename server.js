import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Correct base for Gemini 1.0 models
const BASE = "https://generativelanguage.googleapis.com/v1";

// ✅ Text model
const TEXT_MODEL = "models/gemini-1.0-pro";

// -------- TEXT / JSON generation --------
app.post('/api/generate', async (req, res) => {
  try {
    const url = `${BASE}/${TEXT_MODEL}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await r.json();
    return res.status(r.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || "proxy generate error" });
  }
});

// -------- IMAGE endpoint (placeholder — future) --------
app.post('/api/images', async (req, res) => {
  return res.json({ message: "Image endpoint coming soon" });
});

app.get('/', (_req, res) => res.type('text').send("Chartie proxy OK ✅"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ Chartie proxy running on ${PORT}`)
);
