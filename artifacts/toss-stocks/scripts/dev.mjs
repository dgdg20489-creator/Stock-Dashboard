#!/usr/bin/env node
/**
 * Dev server router:
 * - VITE_PORT=5000  → run Vite directly (main "Start application" workflow)
 * - (no VITE_PORT)  → start Vite on port 5174, wait until it's ready,
 *                     then open proxy on port 5173 (so Replit health-check
 *                     gets a real HTTP 200 on first request).
 */
import { spawn } from "child_process";
import http from "http";
import net from "net";

const VITE_PORT = process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 0;

function spawnVite(extraArgs = [], extraEnv = {}) {
  return spawn(
    "vite",
    ["--config", "vite.config.ts", "--host", "0.0.0.0", ...extraArgs],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env, ...extraEnv },
    }
  );
}

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const s = net.createConnection(port, "127.0.0.1");
      s.on("connect", () => { s.destroy(); resolve(); });
      s.on("error", () => {
        if (Date.now() - start > timeout) return reject(new Error(`Port ${port} not ready`));
        setTimeout(tryConnect, 100);
      });
    };
    tryConnect();
  });
}

if (VITE_PORT === 5000) {
  // ── Main workflow: run Vite directly on port 5000 ─────────────────────────
  const child = spawnVite();
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  // ── Artifact workflow ─────────────────────────────────────────────────────
  const PROXY_PORT = 5173;
  const VITE_INNER = 5174;

  // Start Vite on 5174 in background
  const vite = spawnVite(["--port", String(VITE_INNER)], {
    VITE_PORT: String(VITE_INNER),
  });
  vite.on("exit", (code) => process.exit(code ?? 0));

  // Wait for Vite to be ready, THEN open the proxy on 5173
  waitForPort(VITE_INNER)
    .then(() => {
      const server = http.createServer((req, res) => {
        const opts = {
          hostname: "127.0.0.1",
          port: VITE_INNER,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };
        const proxy = http.request(opts, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxy.on("error", (err) => {
          if (!res.headersSent) {
            res.writeHead(502);
            res.end("Proxy error: " + err.message);
          }
        });
        req.pipe(proxy, { end: true });
      });

      // WebSocket proxy for Vite HMR
      server.on("upgrade", (req, socket, head) => {
        const upstream = net.connect(VITE_INNER, "127.0.0.1", () => {
          const headers = Object.entries(req.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\r\n");
          upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
          if (head && head.length) upstream.write(head);
          upstream.pipe(socket);
          socket.pipe(upstream);
        });
        upstream.on("error", () => socket.destroy());
        socket.on("error", () => upstream.destroy());
      });

      server.listen(PROXY_PORT, "0.0.0.0", () => {
        console.log(`\n  VITE v7.3.1  ready\n`);
        console.log(`  ➜  Local:   http://localhost:${PROXY_PORT}/`);
        console.log(`  ➜  Network: http://0.0.0.0:${PROXY_PORT}/\n`);
      });
    })
    .catch((err) => {
      console.error("Vite failed to start:", err.message);
      process.exit(1);
    });
}
