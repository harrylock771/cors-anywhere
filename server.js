const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use("/", createProxyMiddleware({
  changeOrigin: true,
  selfHandleResponse: false,

  // Dynamically route based on URL
  router: (req) => {
    const url = req.url.slice(1); // remove first slash
    return url.startsWith("http") ? url : `https://${url}`;
  },

  onProxyRes: (proxyRes) => {
    // Remove headers that block iframes
    delete proxyRes.headers["x-frame-options"];
    delete proxyRes.headers["content-security-policy"];
    delete proxyRes.headers["content-security-policy-report-only"];

    // Allow CORS
    proxyRes.headers["access-control-allow-origin"] = "*";
    proxyRes.headers["access-control-allow-headers"] = "*";
  }
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Proxy running on port ${PORT}`);
});
