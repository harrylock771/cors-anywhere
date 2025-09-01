const express = require("express");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const app = express();

// Proxy endpoint
app.get("/*", async (req, res) => {
  try {
    let targetUrl = req.params[0];

    // Auto-prepend https:// if missing
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    console.log(`➡ Proxying: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        "user-agent": req.headers["user-agent"] || "Mozilla/5.0",
      },
    });

    // Clone headers but strip iframe blockers
    const headers = {};
    response.headers.forEach((val, key) => {
      if (
        !["x-frame-options", "content-security-policy", "content-security-policy-report-only"].includes(
          key.toLowerCase()
        )
      ) {
        headers[key] = val;
      }
    });

    // Get body as text
    let body = await response.text();

    // Remove CSP meta tags inside HTML
    body = body.replace(/<meta[^>]*content-security-policy[^>]*>/gi, "");
    body = body.replace(/X-Frame-Options/gi, "");

    // Send cleaned response
    res.set({
      ...headers,
      "access-control-allow-origin": "*", // allow CORS
      "content-security-policy": "", // clear CSP
      "x-frame-options": "", // clear iframe blocking
    });

    res.send(body);
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).send("Proxy Error: " + err.message);
  }
});

// Railway / local port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});
