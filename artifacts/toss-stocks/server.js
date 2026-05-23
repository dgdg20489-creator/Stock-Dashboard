import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

if (API_URL) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: API_URL,
      changeOrigin: true,
    })
  );
}

app.use(express.static(join(__dirname, "dist/public")));

app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist/public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend server on port ${PORT}, proxying API to ${API_URL}`);
});
