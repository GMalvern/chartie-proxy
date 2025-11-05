// Chartie Proxy Server v1.9.2
// Secure middle-tier for Gemini calls

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// **************************************
// ✅ IMPORTANT: Put your Gemini API key here
// **************************************
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";

// **************************************
// Middleware
// **************************************
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// **************************************
// ✅ Test endpoint
// **************************************
app.get("/", (_, res) => {
  res.send("✅ Chartie Proxy Active");
});

// **************************************
// ✅ Main AI Route
// **************************************
app.post("/api/generate", async (req, res) => {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ Proxy Error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// **************************************
// ✅ Start Server
// **************************************
app.listen(PORT, () => {
  console.log(`🚀 Chartie Proxy running on http://localhost:${PORT}`);
});
