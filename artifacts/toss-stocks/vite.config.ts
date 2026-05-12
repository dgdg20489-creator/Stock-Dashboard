import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawVitePort = process.env.VITE_PORT;
const port = rawVitePort && !Number.isNaN(Number(rawVitePort)) && Number(rawVitePort) > 0
  ? Number(rawVitePort)
  : 5173;

const basePath = process.env.BASE_PATH || "/";

const isMainWorkflow = port === 5000;

const replitPlugins = isMainWorkflow && process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
  ? [
      await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
      await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer({
          root: path.resolve(import.meta.dirname, ".."),
        }),
      ),
      await import("@replit/vite-plugin-dev-banner").then((m) =>
        m.devBanner(),
      ),
    ]
  : [];

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...replitPlugins,
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  cacheDir: path.resolve(import.meta.dirname, `node_modules/.vite-${port}`),
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? "8080"}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
