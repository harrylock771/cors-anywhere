import express from "express";

const app = express();

// dynamic import wrapper for node-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Missing ?url parameter");
  }

  try {
    const response = await fetch(target);

    // Copy headers, but skip ones that block embedding
    response.headers.forEach((value, name) => {
      const forbidden = ["x-frame-options", "content-security-policy"];
      if (!forbidden.includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });

    res.status(response.status);

    // Stream response body
    response.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).send("Proxy error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
