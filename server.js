import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ------------------------
// Google API base (v1beta)
// ------------------------
const BASE = "https://generativelanguage.googleapis.com/v1beta";

// ✅ Correct models for v1beta generate routes
const TEXT_MODEL = process.env.GEMINI_MODEL || "models/gemini-1.0-pro"; 
const IMAGE_MODEL = "models/imagegeneration@006";

// ------------------------
// Text / JSON generation (Gemini)
// ------------------------
app.post("/api/generate", async (req, res) => {
  try {
    const model = req.body.model || TEXT_MODEL;

    const url = `${BASE}/${model}:generateContent?key=${process.env.GOOGLE_AI_KEY}`;

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

// ------------------------
// Image generation (Imagen)
// ------------------------
app.post("/api/images", async (req, res) => {
  try {
    const url = `${BASE}/${IMAGE_MODEL}:generateImage?key=${process.env.GOOGLE_AI_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "proxy image error" });
  }
});

// ------------------------
// Health Check
// ------------------------
app.get("/", (_req, res) => {
  res.type("text").send("Chartie proxy OK");
});

// ------------------------
// Server Listen
// ------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Chartie proxy listening on port ${PORT}`);
});
