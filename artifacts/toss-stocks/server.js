import express from "express";
import { createServer } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const API_URL = process.env.API_URL || "";

// Proxy /api/* to API server
if (API_URL) {
  const apiUrl = new URL(API_URL);
  const isHttps = apiUrl.protocol === "https:";
  const requester = isHttps ? httpsRequest : httpRequest;

  app.use("/api", (req, res) => {
    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || (isHttps ? 443 : 80),
      path: "/api" + req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: apiUrl.hostname,
      },
    };

    const proxy = requester(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxy.on("error", (err) => {
      console.error("Proxy error:", err);
      if (!res.headersSent) res.status(502).json({ error: "API unreachable" });
    });

    req.pipe(proxy, { end: true });
  });
}

// Serve static files
const distPath = join(__dirname, "dist/public");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`API proxy target: ${API_URL || "(none)"}`);
});
