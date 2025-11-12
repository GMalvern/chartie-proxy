import express from "express";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

// ----- Config -----
const PORT = process.env.PORT || 10000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("[WARN] GOOGLE_API_KEY is not set. /api/generate will 401.");
}

const app = express();

// Security + perf
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      // allow Tailwind CDN, Google Fonts, jsDelivr for html2canvas/jsPDF
      "script-src": ["'self'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:", "blob:"]
    }
  }
}));
app.use(compression());
app.use(express.json({ limit: "1mb" }));

// Simple rate limit on the API
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
app.use("/api/", limiter);

// Health
app.get("/healthz", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ---- Same-origin AI endpoint ----
app.post("/api/generate", async (req, res) => {
  try {
    if (!GOOGLE_API_KEY) {
      return res.status(401).json({ error: { message: "Missing GOOGLE_API_KEY" } });
    }

    const { model, contents, generationConfig } = req.body || {};
    if (!model || !contents) {
      return res.status(400).json({ error: { message: "Missing model or contents" } });
    }

    // Google Generative Language API v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(GOOGLE_API_KEY)}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      // pass through Google error
      return res.status(upstream.status).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { message: "Proxy error" } });
  }
});

// ---- Static front-end (Chartie) ----
app.use(express.static("public", {
  extensions: ["html"],
  // Cache HTML lightly; assets can be cached by the browser CDNs
  setHeaders: (res, path) => {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// SPA fallback (if you ever add routes)
app.get("*", (req, res) => {
  res.sendFile(new URL("./public/index.html", import.meta.url));
});

app.listen(PORT, () => {
  console.log(`✅ Chartie full-stack listening on :${PORT}`);
});
