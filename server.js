// server.js
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// During testing allow all. Later, restrict to your domains.
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Correct base + model IDs for the current Gemini API
// Docs list these exact IDs: gemini-2.5-flash (text/multimodal) and gemini-2.5-flash-image (image gen).
// https://ai.google.dev/gemini-api/docs/models
const BASE = 'https://generativelanguage.googleapis.com/v1';
const TEXT_MODEL  = 'models/gemini-2.5-flash';
const IMAGE_MODEL = 'models/gemini-2.5-flash-image';

// ---------------------------------------------
// TEXT / JSON generation (generateContent)
// ---------------------------------------------
app.post('/api/generate', async (req, res) => {
  try {
    // Allow client to override the model, but default to 2.5-flash
    const model = req.body?.model || TEXT_MODEL;

    // Shape the upstream request the way Gemini expects it
    const upstreamBody = {
      model,
      // Pass through contents/parts etc. from the client
      contents: req.body?.contents || [],
      systemInstruction: req.body?.systemInstruction,
      tools: req.body?.tools,
      generationConfig: req.body?.generationConfig,
      safetySettings: req.body?.safetySettings,
    };

    const url = `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upstreamBody),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'proxy generate error' });
  }
});

// ---------------------------------------------
// IMAGE generation with Gemini (generateContent)
// Use gemini-2.5-flash-image. Returns image bytes inline in parts.
// ---------------------------------------------
app.post('/api/images', async (req, res) => {
  try {
    const model = req.body?.model || IMAGE_MODEL;

    const upstreamBody = {
      model,
      contents: req.body?.contents || [
        { parts: [{ text: req.body?.prompt || 'A simple classroom poster' }] }
      ],
      generationConfig: req.body?.generationConfig,
      safetySettings: req.body?.safetySettings,
    };

    const url = `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upstreamBody),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'proxy image error' });
  }
});

// Health check
app.get('/', (_req, res) => res.type('text').send('Chartie proxy OK ✅'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Chartie proxy listening on ${PORT}`);
});
