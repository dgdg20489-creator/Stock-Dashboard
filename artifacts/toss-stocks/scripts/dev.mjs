#!/usr/bin/env node
/**
 * Dev server router:
 * - VITE_PORT=5000  → run Vite directly on port 5000 (main "Start application" workflow)
 * - (no VITE_PORT)  → proxy port 5173 → existing Vite on 5000 (artifact canvas workflow)
 */
import { spawn } from "child_process";
import http from "http";
import net from "net";
import fs from "fs";

const LOG = "/tmp/dev-mjs-5173.log";
const log = (...args) => {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}\n`;
  process.stdout.write(line);
  try { fs.appendFileSync(LOG, line); } catch {}
};

const VITE_PORT = process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 0;

process.on("exit", (code) => log(`EXIT code=${code}`));
process.on("SIGTERM", () => { log("SIGTERM received"); process.exit(0); });
process.on("SIGINT",  () => { log("SIGINT received");  process.exit(0); });
process.on("uncaughtException", (err) => { log("uncaughtException:", err.message, err.stack); process.exit(1); });
process.on("unhandledRejection", (err) => { log("unhandledRejection:", String(err)); process.exit(1); });

log(`START pid=${process.pid} VITE_PORT=${VITE_PORT}`);

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const s = net.createConnection(port, "127.0.0.1");
      s.on("connect", () => { s.destroy(); resolve(); });
      s.on("error", () => {
        if (Date.now() - start > timeout) return reject(new Error(`Port ${port} not ready`));
        setTimeout(tryConnect, 200);
      });
    };
    tryConnect();
  });
}

if (VITE_PORT === 5000) {
  // ── Main workflow: run Vite directly on port 5000 ─────────────────────────
  log("mode=direct port=5000");
  const child = spawn(
    "vite",
    ["--config", "vite.config.ts", "--host", "0.0.0.0"],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      shell: true,
      env: { ...process.env },
    }
  );
  child.on("exit", (code, sig) => {
    log(`Vite exited code=${code} sig=${sig}`);
    process.exit(code ?? 0);
  });
} else {
  // ── Artifact canvas workflow: proxy 5173 → existing Vite on 5000 ──────────
  log("mode=proxy 5173→5000");

  waitForPort(5000, 30000)
    .then(() => {
      log("port 5000 ready, opening proxy on 5173");

      const server = http.createServer((req, res) => {
        const opts = {
          hostname: "127.0.0.1",
          port: 5000,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };
        const proxy = http.request(opts, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxy.on("error", (err) => {
          log(`proxy req error: ${err.message}`);
          if (!res.headersSent) {
            res.writeHead(502);
            res.end("Proxy error: " + err.message);
          }
        });
        req.pipe(proxy, { end: true });
      });

      // WebSocket proxy for Vite HMR
      server.on("upgrade", (req, socket, head) => {
        const upstream = net.connect(5000, "127.0.0.1", () => {
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

      server.on("error", (err) => {
        log(`server error: ${err.message}`);
        process.exit(1);
      });

      server.listen(5173, "0.0.0.0", () => {
        log("proxy listening on 5173");
        console.log(`\n  VITE v7.3.1  ready`);
        console.log(`  ➜  Local:   http://localhost:5173/`);
        console.log(`  ➜  Network: http://0.0.0.0:5173/\n`);
      });
    })
    .catch((err) => {
      log(`waitForPort error: ${err.message}`);
      process.exit(1);
    });
}
